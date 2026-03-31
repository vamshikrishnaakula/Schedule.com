#!/bin/bash

echo "=== Keycloak OAuth Configuration Check ==="
echo ""

# Check environment variables
echo "1. Checking environment variables..."
grep "^KEYCLOAK_CLIENT_ID=" .env | head -1
grep "^KEYCLOAK_CLIENT_SECRET=" .env | head -1
grep "^KEYCLOAK_ISSUER=" .env | head -1
echo ""

# Test Keycloak well-known endpoint
echo "2. Testing Keycloak OIDC endpoint..."
curl -s "$KEYCLOAK_ISSUER/.well-known/openid-configuration" | grep -o '"authorization_endpoint":"[^"]*"' || echo "❌ Failed to reach Keycloak"
echo ""

# Check if redirect URI is in ecosystem config
echo "3. Checking ecosystem.config.js..."
grep -A 2 "KEYCLOAK" ecosystem.config.js | head -5
echo ""

# Expected redirect URI
echo "4. Expected Keycloak Redirect URI:"
echo "   https://schedule.leadnest.ai/api/auth/callback/keycloak"
echo ""

echo "5. Action Required:"
echo "   Go to Keycloak Admin Console:"
echo "   https://auth.leadnest.ai/admin/master/console/#/prod-leadnest-realm/clients"
echo ""
echo "   1. Click on your client 'schedule.leadnest'"
echo "   2. Go to 'Settings' tab"
echo "   3. Under 'Access settings', add to 'Valid Redirect URIs':"
echo "      https://schedule.leadnest.ai/api/auth/callback/keycloak"
echo "   4. Also add wildcard (optional but recommended):"
echo "      https://schedule.leadnest.ai/*"
echo "   5. Click 'Save'"
echo ""

echo "6. After saving, restart Cal.com:"
echo "   pm2 restart calcom"
echo ""

echo "7. Then test login again:"
echo "   - Go to https://schedule.leadnest.ai/"
echo "   - Click 'Sign in with Keycloak'"
echo "   - Complete authentication"
echo "   - Should redirect to homepage (not back to login with error)"
