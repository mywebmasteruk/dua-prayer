-- Add MFA-restrictive RLS policies to billing_customers and nonces so they
-- match the 9 sibling tables that already require aal2 when the user has a
-- verified MFA factor (see schemas/13-mfa.sql). Previously these two tables
-- lacked the restrictive policy, so an MFA-enrolled user on an aal1 session
-- could read their own rows directly via the data API. RESTRICTIVE + `to
-- authenticated` only AND-narrows the authenticated role's access on commands
-- that already have a policy; service_role / SECURITY DEFINER writes are
-- unaffected. Additive and reversible (drop policy ...).

-- Restrict access to billing customers if MFA is enabled
create policy restrict_mfa_billing_customers
    on public.billing_customers
    as restrictive
    to authenticated
    using (public.is_mfa_compliant());

-- Restrict access to nonces if MFA is enabled
create policy restrict_mfa_nonces
    on public.nonces
    as restrictive
    to authenticated
    using (public.is_mfa_compliant());


-- Create a function to verify a nonce
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

revoke select on public.invitations from authenticated;

grant select (
          id,
          email,
          account_id,
          invited_by,
          role,
          created_at,
          updated_at,
          expires_at
) on table public.invitations to authenticated;