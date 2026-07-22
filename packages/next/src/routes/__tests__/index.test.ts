import { NextRequest, NextResponse } from 'next/server';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { verifyCaptchaToken } from '@kit/auth/captcha/server';
import { getSupabaseBearerClient } from '@kit/supabase/bearer-client';
import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { enhanceRouteHandler } from '../index';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => ({ __redirect: url })),
}));

vi.mock('@kit/auth/captcha/server', () => ({
  verifyCaptchaToken: vi.fn(),
}));

vi.mock('@kit/supabase/bearer-client', () => ({
  getSupabaseBearerClient: vi.fn(() => ({ __kind: 'bearer' })),
}));

vi.mock('@kit/supabase/server-client', () => ({
  getSupabaseServerClient: vi.fn(() => ({ __kind: 'server' })),
}));

vi.mock('@kit/supabase/require-user', async (importActual) => {
  const actual =
    await importActual<typeof import('@kit/supabase/require-user')>();

  return { ...actual, requireUser: vi.fn() };
});

import { redirect } from 'next/navigation';

// Imported after the mock so it resolves to the real class.
import { MultiFactorAuthError } from '@kit/supabase/require-user';

const requireUserMock = vi.mocked(requireUser);
const redirectMock = vi.mocked(redirect);
const verifyCaptchaTokenMock = vi.mocked(verifyCaptchaToken);

function makeRequest(headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/test', { headers });
}

const routeParams = { params: Promise.resolve({}) };

const authedUser = { id: 'user-1' };

function okHandler() {
  return vi.fn(() => NextResponse.json({ ok: true }));
}

describe('enhanceRouteHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cookie (web) callers', () => {
    it('redirects to the sign-in path on auth failure', async () => {
      requireUserMock.mockResolvedValue({
        error: new Error('nope'),
        data: null,
        redirectTo: '/auth/sign-in',
      } as never);

      const handler = okHandler();
      const route = enhanceRouteHandler(handler);

      const result = await route(makeRequest(), routeParams);

      expect(redirectMock).toHaveBeenCalledWith('/auth/sign-in');
      expect(result).toEqual({ __redirect: '/auth/sign-in' });
      expect(handler).not.toHaveBeenCalled();
    });

    it('redirects to the MFA verify path when a step-up is required', async () => {
      requireUserMock.mockResolvedValue({
        error: new MultiFactorAuthError(),
        data: null,
        redirectTo: '/auth/verify',
      } as never);

      const route = enhanceRouteHandler(okHandler());

      await route(makeRequest(), routeParams);

      expect(redirectMock).toHaveBeenCalledWith('/auth/verify');
    });

    it('re-throws when requireUser throws (preserving the error boundary)', async () => {
      requireUserMock.mockRejectedValue(new Error('boom'));

      const route = enhanceRouteHandler(okHandler());

      await expect(route(makeRequest(), routeParams)).rejects.toThrow('boom');
      expect(redirectMock).not.toHaveBeenCalled();
    });

    it('uses the cookie-based server client', async () => {
      requireUserMock.mockResolvedValue({
        error: null,
        data: authedUser,
      } as never);

      const handler = okHandler();
      await enhanceRouteHandler(handler)(makeRequest(), routeParams);

      expect(getSupabaseServerClient).toHaveBeenCalled();
      expect(requireUserMock).toHaveBeenCalledWith(
        { __kind: 'server' },
        undefined,
      );
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ client: { __kind: 'server' } }),
      );
    });
  });

  describe('bearer (native) callers', () => {
    const bearerHeaders = { authorization: 'Bearer jwt-123' };

    it('returns a JSON 401 (unauthenticated) on auth failure instead of redirecting', async () => {
      requireUserMock.mockResolvedValue({
        error: new Error('nope'),
        data: null,
        redirectTo: '/auth/sign-in',
      } as never);

      const route = enhanceRouteHandler(okHandler());

      const result = await route(makeRequest(bearerHeaders), routeParams);

      expect(redirectMock).not.toHaveBeenCalled();
      expect(result.status).toBe(401);
      await expect(result.json()).resolves.toEqual({
        error: 'unauthenticated',
      });
    });

    it('returns a JSON 401 with `mfa-required` for an MFA step-up', async () => {
      requireUserMock.mockResolvedValue({
        error: new MultiFactorAuthError(),
        data: null,
        redirectTo: '/auth/verify',
      } as never);

      const route = enhanceRouteHandler(okHandler());

      const result = await route(makeRequest(bearerHeaders), routeParams);

      expect(result.status).toBe(401);
      await expect(result.json()).resolves.toEqual({ error: 'mfa-required' });
    });

    it('returns a JSON 401 when requireUser throws', async () => {
      requireUserMock.mockRejectedValue(new Error('aal lookup failed'));

      const route = enhanceRouteHandler(okHandler());

      const result = await route(makeRequest(bearerHeaders), routeParams);

      expect(result.status).toBe(401);
      await expect(result.json()).resolves.toEqual({
        error: 'unauthenticated',
      });
    });

    it('builds the client from the bearer token and passes the token to requireUser', async () => {
      requireUserMock.mockResolvedValue({
        error: null,
        data: authedUser,
      } as never);

      await enhanceRouteHandler(okHandler())(
        makeRequest(bearerHeaders),
        routeParams,
      );

      expect(getSupabaseBearerClient).toHaveBeenCalledWith('jwt-123');
      expect(requireUserMock).toHaveBeenCalledWith(
        { __kind: 'bearer' },
        { token: 'jwt-123' },
      );
    });
  });

  describe('captcha', () => {
    it('lets a bearer skip captcha on an auth-protected route', async () => {
      requireUserMock.mockResolvedValue({
        error: null,
        data: authedUser,
      } as never);

      const handler = okHandler();

      await enhanceRouteHandler(handler, { captcha: true })(
        makeRequest({ authorization: 'Bearer jwt-123' }),
        routeParams,
      );

      expect(verifyCaptchaTokenMock).not.toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
    });

    it('still enforces captcha for a bearer on a public (auth: false) route', async () => {
      const result = await enhanceRouteHandler(okHandler(), {
        captcha: true,
        auth: false,
      })(makeRequest({ authorization: 'Bearer jwt-123' }), routeParams);

      expect(verifyCaptchaTokenMock).not.toHaveBeenCalled();
      expect(result.status).toBe(400);
    });

    it('enforces captcha for cookie callers', async () => {
      const result = await enhanceRouteHandler(okHandler(), {
        captcha: true,
      })(makeRequest(), routeParams);

      expect(result.status).toBe(400);
    });
  });

  describe('success', () => {
    it('invokes the handler with the authenticated user', async () => {
      requireUserMock.mockResolvedValue({
        error: null,
        data: authedUser,
      } as never);

      const handler = okHandler();

      await enhanceRouteHandler(handler)(makeRequest(), routeParams);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ user: authedUser }),
      );
    });
  });
});
