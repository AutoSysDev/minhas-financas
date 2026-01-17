-- Add email column to shared_account_members
ALTER TABLE shared_account_members ADD COLUMN IF NOT EXISTS email TEXT;

-- Update RPC to include email
CREATE OR REPLACE FUNCTION accept_shared_account_invite(invite_id UUID)
RETURNS VOID AS $$
DECLARE
  v_invite RECORD;
  v_user_email TEXT;
BEGIN
  -- Get invite
  SELECT * INTO v_invite FROM shared_account_invites WHERE id = invite_id;
  
  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;
  
  IF v_invite.status != 'pending' THEN
    RAISE EXCEPTION 'Invite already processed';
  END IF;

  -- Get current user email from JWT
  v_user_email := auth.jwt() ->> 'email';

  -- Insert member with email from JWT (reliable for accepted user)
  INSERT INTO shared_account_members (shared_account_id, user_id, role, email)
  VALUES (v_invite.shared_account_id, auth.uid(), 'member', v_user_email);

  -- Update invite status
  UPDATE shared_account_invites
  SET status = 'accepted'
  WHERE id = invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
