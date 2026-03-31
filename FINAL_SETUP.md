# ✅ Cal.com Keycloak SSO - Final Setup

## Your Configuration
- **Domain**: https://schedule.leadnest.ai
- **Port**: 3000
- **Database**: Local PostgreSQL (calcom_db)
- **Keycloak**: https://auth.leadnest.ai/realms/prod-leadnest-realm

## What's Done
✅ Local PostgreSQL database created (`calcom_db`)
✅ Migrations applied (556 migrations)
✅ Prisma client generated
✅ Keycloak provider code added
✅ ALLOWED_HOSTNAMES fixed

## Final Commands (Run These)

```bash
cd /home/ubuntu/cal.com

# 1. Kill any existing processes
pkill -9 -f "next-server"
pkill -9 -f "turbo"
pkill -9 -f "yarn"

# 2. Clean everything
rm -rf apps/web/.next
rm -rf node_modules/.cache
rm -rf .turbo

# 3. Set environment variables (IMPORTANT - must export these)
export ALLOWED_HOSTNAMES='["schedule.leadnest.ai"]'
export DATABASE_URL="postgresql://calcom_user:calcom_password@localhost:5432/calcom_db"
export DATABASE_DIRECT_URL="postgresql://calcom_user:calcom_password@localhost:5432/calcom_db"
export KEYCLOAK_CLIENT_ID="schedule.leadnest"
export KEYCLOAK_CLIENT_SECRET="oY6w5c4uvCj1KhBKQgO1y5WFy8Nkjpg2"
export KEYCLOAK_ISSUER="https://auth.leadnest.ai/realms/prod-leadnest-realm"
export NEXTAUTH_URL="https://schedule.leadnest.ai"

# 4. Build (takes 3-5 minutes)
yarn workspace @calcom/web build

# 5. Start server
yarn workspace @calcom/web start
```

## Test

Once server starts (shows "✓ Ready in XXXms"):

```bash
# Test locally
curl http://localhost:3000/auth/login | grep -o "Sign in with Keycloak"

# Test your domain
curl -k https://schedule.leadnest.ai/ | grep -o "Sign in with Keycloak"
```

You should see: `Sign in with Keycloak`

## Keycloak Configuration

In your Keycloak Admin Console:

1. Go to: https://auth.leadnest.ai/admin/master/console/
2. Select realm: `prod-leadnest-realm`
3. Clients → `schedule.leadnest`
4. Settings → Access Settings:
   - **Valid redirect URIs**:
     ```
     https://schedule.leadnest.ai/api/auth/callback/keycloak
     https://schedule.leadnest.ai/*
     ```
   - **Valid post logout redirect URIs**:
     ```
     https://schedule.leadnest.ai/*
     ```
   - **Web origins**: `https://schedule.leadnest.ai` and `+`
5. Save

## Expected Flow

1. User visits: https://schedule.leadnest.ai/
2. Clicks "Sign in with Keycloak"
3. Redirected to: https://auth.leadnest.ai/realms/prod-leadnest-realm/protocol/openid-connect/auth
4. User logs in with Keycloak
5. Redirected back to: https://schedule.leadnest.ai/ (logged in)

## Troubleshooting

### ALLOWED_HOSTNAMES Error
Must be: `export ALLOWED_HOSTNAMES='["schedule.leadnest.ai"]'`
Note the single quotes around the JSON array!

### Database Error
Make sure local PostgreSQL is running:
```bash
sudo service postgresql status
sudo -u postgres psql -d calcom_db -c "SELECT COUNT(*) FROM users;"
```

### Keycloak Not Showing
- Rebuild with exported env vars
- Check build completed without errors
- Verify KEYCLOAK_* env vars are set

### 500 Error
- Check server logs
- Usually ALLOWED_HOSTNAMES format issue
- Must rebuild after changing env vars
