# Quick Keycloak SSO Fix for Cal.com

## The Problem
- Jackson library (SAML/OIDC team features) tries to create tables
- Your database user doesn't have CREATE permissions
- This blocks Keycloak login from working

## The Solution (30 seconds)

### 1. Update .env - Use RDS, disable Jackson

```bash
# Edit .env
cd /home/ubuntu/cal.com
nano .env
```

**Set these values:**
```env
# Your existing RDS database (don't change this)
DATABASE_URL=postgresql://schedule_user:HBuxheui3ebx%40sv3xS@medeasy-postgresql.cveeg8m4s958.us-west-2.rds.amazonaws.com:5432/schedule_db?sslmode=verify-full&sslrootcert=/home/ubuntu/cal.com/global-bundle.pem
DATABASE_DIRECT_URL=postgresql://schedule_user:HBuxheui3ebx%40sv3xS@medeasy-postgresql.cveeg8m4s958.us-west-2.rds.amazonaws.com:5432/schedule_db?sslmode=verify-full&sslrootcert=/home/ubuntu/cal.com/global-bundle.pem

# Keycloak config
KEYCLOAK_CLIENT_ID=schedule.leadnest
KEYCLOAK_CLIENT_SECRET=oY6w5c4uvCj1KhBKQgO1y5WFy8Nkjpg2
KEYCLOAK_ISSUER=https://auth.leadnest.ai/realms/prod-leadnest-realm

# DISABLE Jackson SSO (this is the key!)
SAML_DATABASE_URL=
SAML_ADMINS=
```

### 2. Restart Server

```bash
# Kill existing processes
pkill -9 -f "next-server"
pkill -9 -f "turbo"

# Start with production build (already built, just start)
cd /home/ubuntu/cal.com/apps/web
NODE_OPTIONS="--max-old-space-size=4096" nohup next start -p 3000 > /tmp/cal.log 2>&1 &

# Wait 10 seconds
sleep 10

# Test
curl http://localhost:3000/auth/login | grep -o "Sign in with Keycloak"
```

### 3. Test Keycloak Login

Open: https://schedule.leadnest.ai/

Click "Sign in with Keycloak" - it should redirect to Keycloak now!

## Why This Works

- **Keycloak provider is already in Cal.com** (packages/features/auth/lib/next-auth-options.ts)
- **You don't need SAML_DATABASE_URL** for basic Keycloak login
- **SAML_DATABASE_URL is ONLY for team/org SSO** (Enterprise feature you're not using)
- **By setting SAML_DATABASE_URL=empty**, Jackson library skips initialization
- **Keycloak OAuth still works** because it uses the main DATABASE_URL

## If It Still Fails

Check logs:
```bash
tail -100 /tmp/cal.log | grep -i error
```

Common issues:
1. **Keycloak redirect URI mismatch** - Add to Keycloak:
   - `https://schedule.leadnest.ai/api/auth/callback/keycloak`
   
2. **Wrong credentials** - Verify in Keycloak admin:
   - Client ID: `schedule.leadnest`
   - Client Secret matches .env

That's it! Should work in 2 minutes max.
