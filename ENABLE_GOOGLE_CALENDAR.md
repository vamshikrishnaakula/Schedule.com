# Enable Google Calendar by Default for All Users

## Problem
- Google Calendar not showing for users
- Keycloak users don't have calendar connected automatically

## Solution

### Option 1: Enable Google Calendar App Globally (Recommended)

1. **Login as Admin**: https://schedule.leadnest.ai/
   - Email: `vamshikrishnaakula99@gmail.com`
   - Password: `Admin123!@#`

2. **Go to Admin Settings**:
   - Settings → Admin → Apps

3. **Enable Google Calendar**:
   - Find "Google Calendar"
   - Click "Enable for all users"

4. **Enable Google Meet**:
   - Find "Google Meet"
   - Click "Enable for all users"

### Option 2: Auto-Connect via Database (Advanced)

Run this SQL to pre-enable Google Calendar for all users:

```sql
-- Enable Google Calendar credential for all users
INSERT INTO "Credential" ("userId", type, appId, key, "userId"::text)
SELECT 
  id as "userId",
  'google_calendar' as type,
  (SELECT id FROM apps WHERE slug = 'google-calendar' LIMIT 1) as appId,
  '{}'::jsonb as key,
  email as "userId"
FROM users
ON CONFLICT DO NOTHING;
```

### Option 3: Force Google Calendar in App Store

Edit `.env` to add:
```env
# Force enable Google apps
NEXT_PUBLIC_GOOGLE_CALENDAR_ENABLED=true
NEXT_PUBLIC_GOOGLE_MEET_ENABLED=true
```

Then rebuild and restart:
```bash
cd /home/ubuntu/cal.com
pm2 restart calcom
```

## For Keycloak Users

When users login via Keycloak:
1. They get a Cal.com account created automatically
2. They need to connect Google Calendar manually (first time)
3. After connecting, it persists for future logins

### To Auto-Connect for Keycloak Users:

Create a webhook or automation that:
1. Triggers on user creation
2. Creates a Google Calendar credential record
3. User just needs to authorize OAuth once

## Test Google Calendar

1. **Login** (either password or Keycloak)
2. **Go to**: Settings → Apps → Google Calendar
3. **Click**: Connect
4. **Authorize**: With Google account
5. **Done**: Calendar syncs automatically

## Verify Google API Credentials

Your `.env` has:
```env
GOOGLE_API_CREDENTIALS={"web":{"client_id":"778638370742-rtc4oro1k5m8htlvsjc9otq8qnisri7e.apps.googleusercontent.com","client_secret":"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"}}
GOOGLE_LOGIN_ENABLED=true
```

✅ This is correct!

## PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs calcom

# Restart
pm2 restart calcom

# Stop
pm2 stop calcom

# Delete
pm2 delete calcom
```

## Quick Fix - Enable for All Users

Run this in your database:

```bash
cd /home/ubuntu/cal.com
sudo -u postgres psql -d calcom_db << 'EOF'
-- Mark Google Calendar as installed for all users
UPDATE "users" SET metadata = 
  COALESCE(metadata, '{}'::jsonb) || 
  '{"installedApps": ["google-calendar"]}'::jsonb
WHERE metadata IS NULL OR metadata->'installedApps' IS NULL;
EOF
echo "✅ Google Calendar enabled for all users"
```

Then restart:
```bash
pm2 restart calcom
```
