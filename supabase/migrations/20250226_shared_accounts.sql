-- Create shared_accounts table
CREATE TABLE IF NOT EXISTS shared_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create shared_account_members table
CREATE TABLE IF NOT EXISTS shared_account_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_account_id UUID NOT NULL REFERENCES shared_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(shared_account_id, user_id)
);

-- Create shared_account_invites table
CREATE TABLE IF NOT EXISTS shared_account_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_account_id UUID NOT NULL REFERENCES shared_accounts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE shared_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_account_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_account_invites ENABLE ROW LEVEL SECURITY;

-- Policies for shared_accounts
CREATE POLICY "Users can view shared accounts they belong to"
  ON shared_accounts FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM shared_account_members WHERE shared_account_id = id
    )
  );

CREATE POLICY "Owners can manage their shared accounts"
  ON shared_accounts FOR ALL
  USING (auth.uid() = owner_user_id);

-- Policies for shared_account_members
CREATE POLICY "Members can view other members of their shared account"
  ON shared_account_members FOR SELECT
  USING (
    shared_account_id IN (
      SELECT shared_account_id FROM shared_account_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage members"
  ON shared_account_members FOR ALL
  USING (
    shared_account_id IN (
      SELECT id FROM shared_accounts WHERE owner_user_id = auth.uid()
    )
  );

-- Policies for shared_account_invites
CREATE POLICY "Owners can create and view invites"
  ON shared_account_invites FOR ALL
  USING (
    shared_account_id IN (
      SELECT id FROM shared_accounts WHERE owner_user_id = auth.uid()
    )
  );

-- Functions to help RLS on other tables (transactions, accounts, etc.)

-- Check if current user is in the same shared account as the target user
CREATE OR REPLACE FUNCTION is_shared_member(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM shared_account_members sam1
    JOIN shared_account_members sam2 ON sam1.shared_account_id = sam2.shared_account_id
    WHERE sam1.user_id = auth.uid() AND sam2.user_id = target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for existing tables to allow shared access
-- We need to DROP existing policies first? Or just ADD one.
-- Assuming existing policy is "Users can only see their own data" (auth.uid() = user_id)

-- Function to safely add shared policy
CREATE OR REPLACE FUNCTION add_shared_policy(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('
    CREATE POLICY "Shared account members can view items"
      ON %I FOR SELECT
      USING (
        auth.uid() = user_id OR is_shared_member(user_id)
      );
  ', table_name);
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
-- Note: You might need to drop existing SELECT policies if they conflict or just have this as an additional permissive one.
-- Supabase RLS policies are permissive (OR), so adding this should work alongside "auth.uid() = user_id".

DO $$
BEGIN
  -- List of tables to update
  PERFORM add_shared_policy('transactions');
  PERFORM add_shared_policy('accounts');
  PERFORM add_shared_policy('cards');
  PERFORM add_shared_policy('goals');
  PERFORM add_shared_policy('budgets');
  PERFORM add_shared_policy('categories');
  PERFORM add_shared_policy('investments');
END $$;
