
-- Attach handle_new_user trigger so signup creates profile + user_roles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Credit wallet helper (security definer so tenant members can credit after verified payment)
CREATE OR REPLACE FUNCTION public.credit_sms_wallet(_tenant uuid, _amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_balance numeric;
BEGIN
  INSERT INTO public.sms_tenant_wallets(tenant_id, balance) VALUES (_tenant, _amount)
    ON CONFLICT (tenant_id) DO UPDATE SET balance = sms_tenant_wallets.balance + EXCLUDED.balance, updated_at = now()
    RETURNING balance INTO new_balance;
  RETURN new_balance;
END $$;
