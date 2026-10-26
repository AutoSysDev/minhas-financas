-- Security Hardening Migration
-- Created: 2026-01-18
-- Description: Ensures Row Level Security (RLS) is enabled and correctly configured for all sensitive tables.

-- 1. Helper function to enable RLS if not already enabled
CREATE OR REPLACE FUNCTION enable_rls(tbl text) RETURNS void AS $$
BEGIN
    EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', tbl);
END;
$$ LANGUAGE plpgsql;

-- 2. Enable RLS on all known tables
SELECT enable_rls('accounts');
SELECT enable_rls('app_settings');
SELECT enable_rls('budgets');
SELECT enable_rls('cards');
SELECT enable_rls('categories');
SELECT enable_rls('fiscal_notes');
SELECT enable_rls('goal_transactions');
SELECT enable_rls('goals');
SELECT enable_rls('investments');
SELECT enable_rls('notification_settings');
SELECT enable_rls('notifications');
SELECT enable_rls('profiles');
SELECT enable_rls('shared_account_invites');
SELECT enable_rls('shared_account_members');
SELECT enable_rls('shared_accounts');
SELECT enable_rls('shopping_list_items');
SELECT enable_rls('shopping_lists');
SELECT enable_rls('subscriptions');
SELECT enable_rls('transactions');

-- 3. Verify critical policies (Example: Profiles)
-- Ensure profiles can only be modified by the user themselves
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Secure App Settings (read-only for public, write restricted)
-- Ensure no public write access exists
DROP POLICY IF EXISTS "Public can insert app settings" ON app_settings;
DROP POLICY IF EXISTS "Public can update app settings" ON app_settings;
DROP POLICY IF EXISTS "Public can delete app settings" ON app_settings;

-- Re-affirm read access
DROP POLICY IF EXISTS "Public can read app settings" ON app_settings;
CREATE POLICY "Public can read app settings" ON app_settings FOR SELECT USING (true);

-- 5. Strict Input Validation Triggers (Optional but recommended)
-- Example: Prevent negative amounts in transactions where not appropriate (logic usually in app, but DB constraint is safer)
-- ALTER TABLE transactions ADD CONSTRAINT check_amount_nonzero CHECK (amount != 0);

-- 6. Audit Logging (Simplified)
-- Create a function to log critical security events (optional implementation)
-- CREATE TABLE IF NOT EXISTS security_audit_log (...);

-- Cleanup helper
DROP FUNCTION enable_rls(text);
