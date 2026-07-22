-- public.get_nonce_status is an administrative SECURITY DEFINER function called
-- by the backend through the service role (see @kit/otp getNonceStatus via the
-- admin client). It was never granted EXECUTE to service_role, so on a freshly
-- built database (e.g. CI) every call is denied. The other administrative nonce
-- functions (create_nonce, verify_nonce, revoke_nonce) are all granted to
-- service_role; this aligns get_nonce_status with them.
grant execute on function public.get_nonce_status to service_role;
