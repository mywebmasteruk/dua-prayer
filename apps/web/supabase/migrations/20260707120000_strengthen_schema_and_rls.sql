-- Restrict what authenticated users may UPDATE to specific columns.
--
-- Previously these tables granted table-level UPDATE to `authenticated`, and
-- immutable columns were guarded only by BEFORE UPDATE triggers. We now also
-- grant column-level UPDATE so Postgres rejects writes to identity/tenancy
-- columns (id, account_id, etc.) before RLS or the triggers run. The triggers
-- remain as defense-in-depth.
--
-- Column privileges are checked against the statement's SET list only, so
-- BEFORE triggers that mutate timestamps/tracking columns on NEW keep working
-- even though `authenticated` no longer holds UPDATE on those columns.

-- public.accounts: user-editable profile columns (slug included: team rename)
revoke update on table "public"."accounts" from "authenticated";
grant update (name, slug, picture_url, public_data)
  on table "public"."accounts" to "authenticated";

-- public.accounts_memberships: only the role (never the user_id/account_id link)
revoke update on table "public"."accounts_memberships" from "authenticated";
grant update (account_role)
  on table "public"."accounts_memberships" to "authenticated";

-- public.invitations: only role and expiry (never identity/delivery columns)
revoke update on table "public"."invitations" from "authenticated";
grant update (role, expires_at)
  on table "public"."invitations" to "authenticated";

-- public.notifications: only the dismissed flag
revoke update on table "public"."notifications" from "authenticated";
grant update (dismissed)
  on table "public"."notifications" to "authenticated";

-- Strengthen database schema and RLS.
--
-- Mirrors the changes made to apps/web/supabase/schemas/*.sql. Each block is
-- idempotent where practical so the migration is safe to re-run.

-- ---------------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------------

-- authenticated never inserts accounts directly: they are created only by the
-- kit.setup_new_user trigger and the create_team_account function (both
-- SECURITY DEFINER). Remove the unused INSERT grant.
revoke insert on table public.accounts from authenticated;

-- Guard identity columns with IS DISTINCT FROM so NULL<->value transitions on
-- the nullable email column are caught too.
create or replace function kit.protect_account_fields () returns trigger as $$
begin
    if current_user in('authenticated', 'anon') then
        if new.id is distinct from old.id
            or new.is_personal_account is distinct from old.is_personal_account
            or new.primary_owner_user_id is distinct from old.primary_owner_user_id
            or new.email is distinct from old.email then
            raise exception 'You do not have permission to update this field';
        end if;
    end if;

    return NEW;
end
$$ language plpgsql
set search_path = '';

-- Personal accounts are deleted through the admin flow (auth.admin.deleteUser),
-- never directly by their owner.
drop policy if exists delete_team_account on public.accounts;

create policy delete_team_account
    on public.accounts
    for delete
    to authenticated
    using (
        auth.uid() = primary_owner_user_id
        and is_personal_account = false
    );

-- ---------------------------------------------------------------------------
-- accounts_memberships
-- ---------------------------------------------------------------------------

-- authenticated never inserts memberships directly: they are created only by
-- accept_invitation (service_role client) and create_team_account
-- (SECURITY DEFINER).
revoke insert on table public.accounts_memberships from authenticated;

-- ---------------------------------------------------------------------------
-- invitations
-- ---------------------------------------------------------------------------

-- authenticated never inserts invitations directly: they are created only by
-- add_invitations_to_account (service_role client).
revoke insert on table public.invitations from authenticated;

alter table public.invitations
    add constraint invitations_expires_after_created check (expires_at > created_at);

alter table public.invitations
    add constraint invitations_email_format check (
        email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    );

-- get_account_invitations returned the TEAM account's name/email as
-- inviter_name/inviter_email; join the inviter's personal account instead.
create
or replace function public.get_account_invitations (account_slug text) returns table (
  id integer,
  email varchar(255),
  account_id uuid,
  invited_by uuid,
  role varchar(50),
  created_at timestamptz,
  updated_at timestamptz,
  expires_at timestamptz,
  inviter_name varchar,
  inviter_email varchar
)
set
  search_path = '' as $$
begin
    return query
    select
        invitation.id,
        invitation.email,
        invitation.account_id,
        invitation.invited_by,
        invitation.role,
        invitation.created_at,
        invitation.updated_at,
        invitation.expires_at,
        inviter.name,
        inviter.email
    from
        public.invitations as invitation
        join public.accounts as account on invitation.account_id = account.id
        -- the inviter's personal account shares its id with the auth user
        left join public.accounts as inviter on invitation.invited_by = inviter.id
    where
        account.slug = account_slug;

end;

$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

-- allow the admin client to prune expired notifications
grant delete on table public.notifications to service_role;

-- ---------------------------------------------------------------------------
-- one-time tokens: pin verify_nonce to the caller's own user id
-- ---------------------------------------------------------------------------

create or replace function public.verify_nonce (
    p_token TEXT,
    p_purpose TEXT,
    p_user_id UUID default null,
    p_required_scopes text[] default null,
    p_max_verification_attempts INTEGER default 5,
    p_ip INET default null,
    p_user_agent TEXT default null
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
    set
        SEARCH_PATH to '' as $$
DECLARE
    v_nonce          RECORD;
    v_exhausted      BOOLEAN;
    v_max_attempts   INTEGER := least(greatest(coalesce(p_max_verification_attempts, 5), 1), 10);
BEGIN
    -- SECURITY: authenticated callers may only act on their own (or anonymous)
    -- tokens. Without this pin a user could pass another user's id and burn or
    -- revoke that user's active tokens via failed attempts. The caller's role
    -- is read from the JWT claim, falling back to the role GUC set by SET
    -- ROLE: inside a SECURITY DEFINER function current_user is the function
    -- owner, never the caller, so neither is usable here. The service_role
    -- client keeps the ability to verify on behalf of any user.
    IF coalesce(auth.jwt() ->> 'role', current_setting('role', true)) = 'authenticated' THEN
        p_user_id := (select auth.uid());
    END IF;

    -- Find and update the nonce in a single operation
    -- First filter by indexed columns to reduce candidate rows, then do bcrypt comparison
    WITH candidate_nonces AS (
        -- Use index to filter candidates by purpose, user_id, expiry, status
        SELECT id, client_token, user_id, purpose, metadata, scopes,
               verification_attempts, expires_at, used_at, revoked
        FROM public.nonces
        WHERE purpose = p_purpose
          AND used_at IS NULL
          AND NOT revoked
          AND expires_at > NOW()
          -- Only apply user_id filter if the token was created for a specific user
          AND (
            -- Case 1: Anonymous token (user_id is NULL in DB)
            (user_id IS NULL)
                OR
                -- Case 2: User-specific token (check if user_id matches)
            (user_id = p_user_id)
            )
        ORDER BY created_at DESC
        -- Safety net: Limit to 100 most recent candidates to cap worst-case performance
        -- In production, auto-revocation keeps this low, but this protects against edge cases
        LIMIT 100
            -- CRITICAL: Lock rows to prevent race conditions in concurrent verifications
            -- SKIP LOCKED ensures other requests fail fast instead of waiting
            FOR UPDATE SKIP LOCKED
    ),
         -- SECURITY: Count this verification attempt against ALL active candidate
         -- nonces for this purpose/user, regardless of whether the supplied token
         -- matches. Counting only successful matches (the previous behaviour) meant
         -- wrong guesses were never recorded, so the attempt cap never tripped and
         -- the token was unboundedly brute-forceable.
         -- NOTE: create_nonce defaults revoke_previous=true, so there is normally a
         -- single active nonce per (purpose, user_id). If a caller ever issues
         -- multiple concurrent nonces for the same purpose+user, a failed guess
         -- counts against all of them together.
         updated_nonces AS (
             UPDATE public.nonces n
                 SET verification_attempts        = n.verification_attempts + 1,
                     last_verification_at         = NOW(),
                     last_verification_ip         = COALESCE(p_ip, n.last_verification_ip),
                     last_verification_user_agent = COALESCE(p_user_agent, n.last_verification_user_agent)
                 FROM candidate_nonces c
                 WHERE n.id = c.id
                 RETURNING n.*
         ),
         matched_nonce AS (
             -- Now do the expensive bcrypt comparison only on the (incremented) candidates
             SELECT *
             FROM updated_nonces
             WHERE client_token = extensions.crypt(p_token, client_token)
             LIMIT 1
         )
    SELECT * INTO v_nonce FROM matched_nonce;

    -- No token matched. The attempt has been counted on the active candidate
    -- nonce(s); revoke any that have now exceeded the cap so further guesses
    -- fail fast (the candidate set is no longer eligible on the next call).
    IF v_nonce.id IS NULL THEN
        WITH exhausted AS (
            UPDATE public.nonces
                SET revoked        = TRUE,
                    revoked_reason = 'Maximum verification attempts exceeded'
                WHERE purpose = p_purpose
                    AND used_at IS NULL
                    AND NOT revoked
                    AND ((user_id IS NULL) OR (user_id = p_user_id))
                    AND verification_attempts > v_max_attempts
                RETURNING id
        )
        SELECT count(*) > 0 INTO v_exhausted FROM exhausted;

        IF v_exhausted THEN
            RETURN jsonb_build_object(
                    'valid', false,
                    'message', 'Token revoked due to too many verification attempts',
                    'max_attempts_exceeded', true
                   );
        END IF;

        RETURN jsonb_build_object(
                'valid', false,
                'message', 'Invalid or expired token'
               );
    END IF;

    -- Check if max verification attempts exceeded (using the incremented value)
    IF v_nonce.verification_attempts > v_max_attempts THEN
        -- Automatically revoke the token
        UPDATE public.nonces
        SET revoked        = TRUE,
            revoked_reason = 'Maximum verification attempts exceeded'
        WHERE id = v_nonce.id;

        RETURN jsonb_build_object(
                'valid', false,
                'message', 'Token revoked due to too many verification attempts',
                'max_attempts_exceeded', true
               );
    END IF;

    -- Check scopes if required
    IF p_required_scopes IS NOT NULL AND array_length(p_required_scopes, 1) > 0 THEN
        -- Fix scope validation to properly check if token scopes contain all required scopes
        -- Using array containment check: array1 @> array2 (array1 contains array2)
        IF NOT (v_nonce.scopes @> p_required_scopes) THEN
            RETURN jsonb_build_object(
                    'valid', false,
                    'message', 'Token does not have required permissions',
                    'token_scopes', v_nonce.scopes,
                    'required_scopes', p_required_scopes
                   );
        END IF;
    END IF;

    -- Mark nonce as used
    UPDATE public.nonces
    SET used_at = NOW()
    WHERE id = v_nonce.id;

    -- Return success with metadata
    RETURN jsonb_build_object(
            'valid', true,
            'user_id', v_nonce.user_id,
            'metadata', v_nonce.metadata,
            'scopes', v_nonce.scopes,
            'purpose', v_nonce.purpose
           );
END;
$$;

grant
    execute on function public.verify_nonce to authenticated,
    service_role;

-- ---------------------------------------------------------------------------
-- user_account_workspace view: deterministic subscription status
-- ---------------------------------------------------------------------------

create or replace view
    public.user_account_workspace
            with
            (security_invoker = true) as
select
    accounts.id as id,
    accounts.name as name,
    accounts.picture_url as picture_url,
    (
        select
            status
        from
            public.subscriptions
        where
            account_id = accounts.id
        order by
            created_at desc
        limit
            1
    ) as subscription_status
from
    public.accounts
where
    primary_owner_user_id = (select auth.uid ())
  and accounts.is_personal_account = true
limit
    1;

grant
    select
    on public.user_account_workspace to authenticated,
    service_role;

-- ---------------------------------------------------------------------------
-- storage: split the account_image policy per command so DELETE requires
-- settings.manage (a FOR ALL policy only consults USING for DELETE, which let
-- any member delete the team image).
-- ---------------------------------------------------------------------------

drop policy if exists account_image on storage.objects;

create policy account_image_select on storage.objects for
select
  to authenticated using (
    bucket_id = 'account_image'
    and (
      kit.get_storage_filename_as_uuid (name) = auth.uid ()
      or public.has_role_on_account (kit.get_storage_filename_as_uuid (name))
    )
  );

create policy account_image_insert on storage.objects for insert to authenticated
with
  check (
    bucket_id = 'account_image'
    and (
      kit.get_storage_filename_as_uuid (name) = auth.uid ()
      or public.has_permission (
        auth.uid (),
        kit.get_storage_filename_as_uuid (name),
        'settings.manage'
      )
    )
  );

create policy account_image_update on storage.objects
for update
  to authenticated using (
    bucket_id = 'account_image'
    and (
      kit.get_storage_filename_as_uuid (name) = auth.uid ()
      or public.has_permission (
        auth.uid (),
        kit.get_storage_filename_as_uuid (name),
        'settings.manage'
      )
    )
  )
with
  check (
    bucket_id = 'account_image'
    and (
      kit.get_storage_filename_as_uuid (name) = auth.uid ()
      or public.has_permission (
        auth.uid (),
        kit.get_storage_filename_as_uuid (name),
        'settings.manage'
      )
    )
  );

create policy account_image_delete on storage.objects for delete to authenticated using (
  bucket_id = 'account_image'
  and (
    kit.get_storage_filename_as_uuid (name) = auth.uid ()
    or public.has_permission (
      auth.uid (),
      kit.get_storage_filename_as_uuid (name),
      'settings.manage'
    )
  )
);
