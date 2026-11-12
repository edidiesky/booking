
-- 075_payment_by_transaction_id.sql
CREATE OR REPLACE FUNCTION public.payment_by_transaction_id(p_tx text)
RETURNS SETOF payments
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM payments WHERE transaction_id = p_tx LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.payment_by_transaction_id(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.payment_by_transaction_id(text)
  TO booking_app, booking_worker;