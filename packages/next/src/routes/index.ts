import 'server-only';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

import type { SupabaseClient } from '@supabase/supabase-js';

import * as z from 'zod';

import { verifyCaptchaToken } from '@kit/auth/captcha/server';
import { getSupabaseBearerClient } from '@kit/supabase/bearer-client';
import { Database } from '@kit/supabase/database';
import { MultiFactorAuthError, requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { JWTUserData } from '@kit/supabase/types';

interface Config<Schema> {
  auth?: boolean;
  captcha?: boolean;
  schema?: Schema;
}

interface HandlerParams<
  Schema extends z.ZodType | undefined,
  RequireAuth extends boolean | undefined,
> {
  request: NextRequest;
  user: RequireAuth extends false ? undefined : JWTUserData;
  body: Schema extends z.ZodType ? z.output<Schema> : undefined;
  params: Record<string, string>;
  client: SupabaseClient<Database>;
}

/**
 * Enhanced route handler function.
 *
 * This function takes a request and parameters object as arguments and returns a route handler function.
 * The route handler function can be used to handle HTTP requests and apply additional enhancements
 * based on the provided parameters.
 *
 * Auth source is detected from the request:
 * - `Authorization: Bearer <jwt>` header present → builds a Supabase client from
 *   that token (mobile / native consumers holding their session in SecureStore).
 * - No bearer header → falls back to the cookie-based server client (web).
 *
 * On auth failure the response depends on the caller:
 * - Bearer (native) callers can't follow an HTTP redirect, so they get a JSON
 *   401 with a discriminator (`unauthenticated` or `mfa-required`) to branch on.
 * - Cookie (web) callers keep the original redirect to sign-in / MFA verify,
 *   matching pre-bearer behaviour.
 *
 * Captcha verification is skipped when a bearer is present — the JWT was minted
 * through Supabase Auth (which applies its own rate limiting) and native auth
 * never traverses captcha-protected route handlers anyway.
 *
 * Usage:
 * export const POST = enhanceRouteHandler(
 *   ({ request, body, user }) => {
 *     return new Response(`Hello, ${body.name}!`);
 *   },
 *   {
 *     schema: z.object({
 *       name: z.string(),
 *     }),
 *   },
 * );
 *
 */
export const enhanceRouteHandler = <
  Body,
  Params extends Config<z.ZodType<Body>>,
>(
  // Route handler function
  handler:
    | ((
        params: HandlerParams<Params['schema'], Params['auth']>,
      ) => NextResponse | Response)
    | ((
        params: HandlerParams<Params['schema'], Params['auth']>,
      ) => Promise<NextResponse | Response>),
  // Parameters object
  params?: Params,
) => {
  /**
   * Route handler function.
   *
   * This function takes a request object as an argument and returns a response object.
   */
  return async function routeHandler(
    request: NextRequest,
    routeParams: {
      params: Promise<Record<string, string>>;
    },
  ) {
    type UserParam = Params['auth'] extends false ? undefined : JWTUserData;

    let user: UserParam = undefined as UserParam;

    // Detect bearer mode from the Authorization header
    const bearer = getBearerToken(request);
    const isBearerMode = bearer !== undefined;

    // Check if the captcha token should be verified. A bearer may skip captcha
    // only when auth verification will actually run on this route — i.e.
    // `auth !== false`. The bearer itself isn't trusted yet at this point (the
    // JWT is verified later in `requireUser`); rather, the skip is safe because
    // captcha-protected flows that don't require an existing user (sign-in /
    // sign-up) run with `auth: false` and therefore never reach this branch,
    // while an invalid bearer on an `auth: true` route is still rejected below.
    const trustBearerForCaptcha = isBearerMode && (params?.auth ?? true);

    const shouldVerifyCaptcha =
      (params?.captcha ?? false) && !trustBearerForCaptcha;

    // Verify the captcha token if required and setup
    if (shouldVerifyCaptcha) {
      const token = captchaTokenGetter(request);

      // If the captcha token is not provided, return a 400 response.
      if (token) {
        await verifyCaptchaToken(token);
      } else {
        return new Response('Captcha token is required', { status: 400 });
      }
    }

    // Build client from bearer token if present, else fall back to cookie-based
    // server client.
    const client = bearer
      ? getSupabaseBearerClient(bearer)
      : getSupabaseServerClient();

    const shouldVerifyAuth = params?.auth ?? true;

    // Check if the user should be authenticated
    if (shouldVerifyAuth) {
      // Get the authenticated user. For bearer callers pass the JWT explicitly — the client has no session storage to read claims from.
      let auth: Awaited<ReturnType<typeof requireUser>>;

      try {
        auth = await requireUser(
          client,
          isBearerMode ? { token: bearer } : undefined,
        );
      } catch (error) {
        // requireUser throws when the assurance-level lookup fails. Bearer
        // callers get a JSON 401; cookie callers re-throw to preserve the
        // original behaviour (the error boundary / 500 response).
        if (isBearerMode) {
          return NextResponse.json(
            { error: 'unauthenticated' },
            { status: 401 },
          );
        }

        throw error;
      }

      // If the user is not authenticated, native callers get a JSON 401 with
      // the error kind; web callers are redirected as before.
      if (auth.error) {
        if (isBearerMode) {
          const errorKind =
            auth.error instanceof MultiFactorAuthError
              ? 'mfa-required'
              : 'unauthenticated';

          return NextResponse.json({ error: errorKind }, { status: 401 });
        }

        return redirect(auth.redirectTo);
      }

      user = auth.data as UserParam;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any;

    if (params?.schema) {
      // clone the request to read the body
      // so that we can pass it to the handler safely
      const json = await request.clone().json();
      const parsedBody = await params.schema.safeParseAsync(json);

      if (parsedBody.success) {
        body = parsedBody.data;
      } else {
        return NextResponse.json(
          { error: parsedBody.error.message || 'Invalid request body' },
          { status: 400 },
        );
      }
    }

    return handler({
      request,
      body,
      user,
      params: await routeParams.params,
      client,
    });
  };
};

/**
 * Get the bearer token from the request Authorization header.
 * Returns undefined when the header is missing or not in `Bearer <token>` form.
 * @param request
 */
function getBearerToken(request: NextRequest): string | undefined {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) return undefined;

  const match = /^Bearer\s+(.+)$/i.exec(authHeader);

  return match?.[1]?.trim();
}

/**
 * Get the captcha token from the request headers.
 * @param request
 */
function captchaTokenGetter(request: NextRequest) {
  return request.headers.get('x-captcha-token');
}
