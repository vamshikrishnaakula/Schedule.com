#!/bin/bash

echo "=== Cal.com Keycloak SSO Verification ==="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    exit 1
fi

echo "✓ .env file found"
echo ""

# Check Keycloak environment variables
echo "Checking Keycloak configuration..."
echo ""

if grep -q "KEYCLOAK_CLIENT_ID=" .env; then
    KEYCLOAK_CLIENT_ID=$(grep "KEYCLOAK_CLIENT_ID=" .env | cut -d '=' -f2)
    echo "✓ KEYCLOAK_CLIENT_ID: $KEYCLOAK_CLIENT_ID"
else
    echo "❌ KEYCLOAK_CLIENT_ID not set"
fi

if grep -q "KEYCLOAK_CLIENT_SECRET=" .env; then
    KEYCLOAK_CLIENT_SECRET=$(grep "KEYCLOAK_CLIENT_SECRET=" .env | cut -d '=' -f2)
    if [ -n "$KEYCLOAK_CLIENT_SECRET" ]; then
        echo "✓ KEYCLOAK_CLIENT_SECRET: [SET]"
    else
        echo "❌ KEYCLOAK_CLIENT_SECRET is empty"
    fi
else
    echo "❌ KEYCLOAK_CLIENT_SECRET not set"
fi

if grep -q "KEYCLOAK_ISSUER=" .env; then
    KEYCLOAK_ISSUER=$(grep "KEYCLOAK_ISSUER=" .env | cut -d '=' -f2)
    echo "✓ KEYCLOAK_ISSUER: $KEYCLOAK_ISSUER"
else
    echo "❌ KEYCLOAK_ISSUER not set"
fi

echo ""
echo "Checking SAML/OIDC configuration..."
echo ""

if grep -q "SAML_DATABASE_URL=" .env; then
    SAML_DB=$(grep "SAML_DATABASE_URL=" .env | cut -d '=' -f2)
    if [ -n "$SAML_DB" ]; then
        echo "✓ SAML_DATABASE_URL: [SET]"
    else
        echo "❌ SAML_DATABASE_URL is empty"
    fi
else
    echo "❌ SAML_DATABASE_URL not set"
fi

if grep -q "SAML_ADMINS=" .env; then
    SAML_ADMINS=$(grep "SAML_ADMINS=" .env | cut -d '=' -f2)
    echo "✓ SAML_ADMINS: $SAML_ADMINS"
else
    echo "❌ SAML_ADMINS not set"
fi

if grep -q "SAML_CLIENT_SECRET_VERIFIER=" .env; then
    SAML_SECRET=$(grep "SAML_CLIENT_SECRET_VERIFIER=" .env | cut -d '=' -f2)
    if [ -n "$SAML_SECRET" ] && [ "$SAML_SECRET" != "your_jwt_secret_here_at_least_32_characters" ]; then
        echo "✓ SAML_CLIENT_SECRET_VERIFIER: [SET]"
    else
        echo "⚠ SAML_CLIENT_SECRET_VERIFIER: [DEFAULT VALUE - CHANGE THIS!]"
    fi
else
    echo "❌ SAML_CLIENT_SECRET_VERIFIER not set"
fi

echo ""
echo "=== Next Steps ==="
echo ""
echo "1. Create the SAML database in PostgreSQL:"
echo "   psql \"<your_connection_string>\" -c \"CREATE DATABASE schedule_saml;\""
echo ""
echo "2. Update SAML_CLIENT_SECRET_VERIFIER with a secure random value:"
echo "   openssl rand -base64 32"
echo ""
echo "3. Restart your Cal.com instance:"
echo "   pm2 restart all  # or however you run it"
echo ""
echo "4. Test login at: https://schedule.leadnest.ai/auth/login"
echo ""
echo "5. Look for 'Sign in with Keycloak' button"
echo ""
