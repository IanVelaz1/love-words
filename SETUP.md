# Love Words — Setup Guide

## 1. Run the database migration

Go to your **Supabase dashboard → SQL Editor** and run the file:

```
supabase/migrations/001_init.sql
```

Copy the entire SQL content and paste it into the Supabase SQL editor, then click **Run**.

**Supabase project URL:** https://supabase.com/dashboard/project/msnpsyuhpfwiqnlvmbys/sql/new

## 2. Add the service role key to .env.local

Get your **Service Role Key** from:  
Supabase Dashboard → Settings → API → Service Role (secret)

Add it to `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

This is needed by the transcription API route to generate signed audio URLs.

## 3. Update the transcription API to use service role

After adding the service role key, update `src/app/api/transcribe/route.ts` to use it for storage access.

## 4. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000

## 5. Configure Supabase Auth

In your Supabase dashboard → Authentication → Email → Enable "Email OTP" (magic links).

Set the **Site URL** to `http://localhost:3000` in:
Supabase Dashboard → Authentication → URL Configuration

## 6. Invite code setup

The app is invite-only. To create invite codes, insert them directly into the `invite_codes` table via the Supabase table editor, or use the SQL editor:

```sql
INSERT INTO invite_codes (code, created_by)
VALUES ('LOVE2024', null);
```

Users can redeem codes after signing up (invite gate is ready to extend).
