ALTER TABLE public.items ADD COLUMN IF NOT EXISTS summary text;

UPDATE public.items SET category = CASE
  WHEN category IN ('Documents','Warranties','Subscriptions','Gift Cards','Return Windows') THEN category
  WHEN category = 'Electronics' THEN 'Warranties'
  WHEN category = 'Household' THEN 'Warranties'
  ELSE 'Documents'
END;

ALTER TABLE public.items ALTER COLUMN category SET DEFAULT 'Documents';

ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_category_check;
ALTER TABLE public.items ADD CONSTRAINT items_category_check
  CHECK (category IN ('Documents','Warranties','Subscriptions','Gift Cards','Return Windows'));