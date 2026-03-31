# ✅ Google Calendar & Conferencing Setup

## Problem
Google Calendar and conferencing not working because `GOOGLE_LOGIN_ENABLED=false`

## Solution

### 1. Enable Google Login
```bash
cd /home/ubuntu/cal.com
sed -i 's/^GOOGLE_LOGIN_ENABLED=false/GOOGLE_LOGIN_ENABLED=true/' .env
grep "^GOOGLE_LOGIN_ENABLED" .env
# Should show: GOOGLE_LOGIN_ENABLED=true
```

### 2. Verify Google API Credentials
Your `.env` already has the correct credentials:
```env
GOOGLE_API_CREDENTIALS={"web":{"client_id":"778638370742-rtc4oro1k5m8htlvsjc9otq8qnisri7e.apps.googleusercontent.com","client_secret":"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","redirect_uris":["https://schedule.leadnest.ai/api/auth/callback/google","https://schedule.leadnest.ai/api/integrations/google/callback","https://schedule.leadnest.ai/api/integrations/googlecalendar/callback"]}}
```

### 3. Rebuild and Restart
```bash
cd /home/ubuntu/cal.com

# Kill existing server
pkill -9 -f "next-server"
pkill -9 -f "turbo"

# Clean build cache
rm -rf apps/web/.next

# Set environment variables
export ALLOWED_HOSTNAMES='["schedule.leadnest.ai"]'
export DATABASE_URL="postgresql://calcom_user:calcom_password@localhost:5432/calcom_db"
export KEYCLOAK_CLIENT_ID="schedule.leadnest"
export KEYCLOAK_CLIENT_SECRET="oY6w5c4uvCj1KhBKQgO1y5WFy8Nkjpg2"
export KEYCLOAK_ISSUER="https://auth.leadnest.ai/realms/prod-leadnest-realm"
export GOOGLE_LOGIN_ENABLED="true"

# Build (takes 3-5 minutes)
yarn workspace @calcom/web build

# Start server
yarn workspace @calcom/web start
```

### 4. Test Google Integration

Once server starts:
```bash
# Test Google provider is registered
curl http://localhost:3000/api/auth/providers | grep -o '"google"'

# Test login page shows Google button
curl http://localhost:3000/auth/login | grep -o "Sign in with Google"
```

### 5. Connect Google Calendar

1. Login at: https://schedule.leadnest.ai/
   - Email: vamshikrishnaakula99@gmail.com
   - Password: Admin123!@#

2. Go to: **Settings** → **Apps** → **Google Calendar**

3. Click **Connect**

4. Authorize with your Google account

5. After connecting, Google Calendar will sync your availability

### 6. Google Meet/Conferencing

After connecting Google Calendar:
1. Go to: **Settings** → **Apps** → **Google Meet**
2. Click **Connect**
3. Authorize
4. Now you can offer Google Meet as a meeting option

## Google Cloud Console Setup (Already Done ✅)

Your Google OAuth app is configured with:
- **Client ID**: `778638370742-rtc4oro1k5m8htlvsjc9otq8qnisri7e.apps.googleusercontent.com`
- **Redirect URIs**:
  - `https://schedule.leadnest.ai/api/auth/callback/google`
  - `https://schedule.leadnest.ai/api/integrations/google/callback`
  - `https://schedule.leadnest.ai/api/integrations/googlecalendar/callback`

## Troubleshooting

### Google Login Not Showing
- Rebuild with `GOOGLE_LOGIN_ENABLED=true`
- Clear browser cache
- Check server logs for errors

### Google Calendar Sync Not Working
- Make sure you connected Google Calendar in Settings → Apps
- Check Google Cloud Console has Calendar API enabled
- Verify redirect URIs match exactly

### "Invalid Grant" Error
- Re-authorize Google connection
- Check system time is synchronized
- Verify Google OAuth app is not in test mode

## Quick Status Check

```bash
# Check if server is running
ps aux | grep next-server

# Check Google provider
curl http://localhost:3000/api/auth/providers | python3 -m json.tool | grep google

# Check logs
tail -100 /tmp/cal-com.log | grep -i google
```
