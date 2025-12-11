@echo off
echo Applying friendships RLS fix...
echo.
echo Please run this SQL in your Supabase SQL Editor:
echo https://supabase.com/dashboard/project/YOUR_PROJECT/sql
echo.
type supabase\migrations\fix_friendships_rls_for_profile_stats.sql
echo.
echo Or if you have Supabase CLI installed, run:
echo supabase db push
pause
