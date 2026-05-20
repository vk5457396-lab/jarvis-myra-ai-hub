-- Revoke execute on internal/auth-only SECURITY DEFINER functions from anon and public
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.process_withdrawal(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.request_withdrawal(integer, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.credit_referral_wallet(uuid, text, integer, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.process_referral_commission(uuid, text, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.assign_admin_on_signup() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.prevent_protected_profile_updates() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.set_telegram_alert_settings_updated_at() FROM anon, public;

-- Re-grant to authenticated where the function legitimately needs to be called from the app
GRANT EXECUTE ON FUNCTION public.request_withdrawal(integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_withdrawal(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- get_purchase_counts and get_referrer_by_code are intentionally callable by anon (social proof + referral lookup)
GRANT EXECUTE ON FUNCTION public.get_purchase_counts() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_referrer_by_code(text) TO anon, authenticated;