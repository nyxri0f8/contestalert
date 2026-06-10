-- Create trigger to automatically sync profiles table updates back to auth.users raw_user_meta_data.
-- This ensures that JWT tokens contain the up-to-date role and onboarding status without querying the database in Next.js middleware.

CREATE OR REPLACE FUNCTION sync_profile_to_auth_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    coalesce(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', NEW.role,
      'onboarding_completed', NEW.onboarding_completed
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync profile updates to auth metadata
DROP TRIGGER IF EXISTS on_profile_changed ON profiles;
CREATE TRIGGER on_profile_changed
  AFTER INSERT OR UPDATE OF role, onboarding_completed ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_auth_metadata();
