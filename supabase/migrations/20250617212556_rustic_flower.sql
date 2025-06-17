/*
  # Fix RLS Policy for Profiles Table

  1. Security Updates
    - Update INSERT policy for profiles table to allow new user registration
    - Ensure authenticated users can create their own profile
    - Maintain security while allowing profile creation during registration

  2. Changes
    - Modify INSERT policy to use auth.uid() instead of uid()
    - Add proper conditions for profile creation
    - Ensure RLS remains secure
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new INSERT policy that allows users to create their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure the SELECT policy uses auth.uid() as well
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Ensure the UPDATE policy uses auth.uid() as well
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add a DELETE policy for completeness
CREATE POLICY "Users can delete own profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);