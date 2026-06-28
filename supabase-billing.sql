-- AgriNexus billing / subscriptions (Stripe sync)
-- Изпълнете в Supabase SQL Editor след supabase-setup.sql

CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free', 'pro', 'stopyanstvo')),
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (
    status IN ('inactive', 'active', 'trialing', 'past_due', 'canceled')
  ),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  current_period_end TIMESTAMPTZ,
  trial_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer
  ON user_subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription
  ON user_subscriptions(stripe_subscription_id);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Потребителят вижда собствения си абонамент
CREATE POLICY "Users read own subscription"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- API (service role) управлява записите
CREATE POLICY "Service role full access user_subscriptions"
  ON user_subscriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Ако таблицата вече съществува без trial_used:
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS trial_used BOOLEAN NOT NULL DEFAULT false;
