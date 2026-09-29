ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS renewal_cycle TEXT;

ALTER TABLE public.items
  DROP CONSTRAINT IF EXISTS items_renewal_cycle_check;

ALTER TABLE public.items
  ADD CONSTRAINT items_renewal_cycle_check
  CHECK (renewal_cycle IS NULL OR renewal_cycle IN ('weekly', 'monthly', 'yearly'));

ALTER TABLE public.items
  DROP CONSTRAINT IF EXISTS items_price_check;

ALTER TABLE public.items
  ADD CONSTRAINT items_price_check
  CHECK (price IS NULL OR price >= 0);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_currency TEXT NOT NULL DEFAULT 'INR';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_preferred_currency_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_preferred_currency_check
  CHECK (preferred_currency IN ('INR', 'USD', 'JPY'));

COMMENT ON COLUMN public.items.price IS 'Original subscription price in the stored currency.';
COMMENT ON COLUMN public.items.currency IS 'ISO currency code for the stored price; null means unknown.';
COMMENT ON COLUMN public.items.renewal_cycle IS 'Subscription billing interval: weekly, monthly, or yearly.';
COMMENT ON COLUMN public.profiles.preferred_currency IS 'Display preference only; it never converts stored amounts.';

GRANT SELECT, INSERT, UPDATE ON public.items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
