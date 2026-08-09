-- ============ ADMIN USER MANAGEMENT FUNCTIONS ============
-- Allow admins to update user status (enable/disable) via auth.users + profiles

-- Update user status (enable/disable)
CREATE OR REPLACE FUNCTION admin_update_user_status(p_user_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if the caller is an admin
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Not authorized. Only admins can update user status.';
  END IF;

  -- Update profiles status
  UPDATE profiles SET status = p_status WHERE id = p_user_id;

  -- Ban/unban the user in auth.users
  IF p_status = 'disabled' THEN
    UPDATE auth.users SET banned_until = now() + interval '100 years' WHERE id = p_user_id;
  ELSE
    UPDATE auth.users SET banned_until = NULL WHERE id = p_user_id;
  END IF;
END;
$$;

-- Delete a user (cascades to profiles and all related data)
CREATE OR REPLACE FUNCTION admin_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if the caller is an admin
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Not authorized. Only admins can delete users.';
  END IF;

  -- Delete from auth.users (cascades to profiles and all related data)
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_update_user_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_user(uuid) TO authenticated;