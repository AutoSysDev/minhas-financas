insert into app_settings (key, stripe_product_id, stripe_price_monthly_id, stripe_price_yearly_id, currency, amount_monthly, amount_yearly, updated_at)
values (
  'stripe',
  'prod_Tgi6NFQD8CA0K0',
  'price_1SjKg4AW8YOPClRkwooO3WQx',
  'price_1SjKgGAW8YOPClRkaXZNorIf',
  'BRL',
  1599,
  9990,
  now()
)
on conflict (key) do update set
  stripe_product_id = excluded.stripe_product_id,
  stripe_price_monthly_id = excluded.stripe_price_monthly_id,
  stripe_price_yearly_id = excluded.stripe_price_yearly_id,
  currency = excluded.currency,
  amount_monthly = excluded.amount_monthly,
  amount_yearly = excluded.amount_yearly,
  updated_at = now();
