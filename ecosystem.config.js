module.exports = {
  apps: [{
    name: 'calcom',
    script: 'yarn',
    args: 'workspace @calcom/web start',
    cwd: '/home/ubuntu/cal.com',
    env: {
      ALLOWED_HOSTNAMES: '["schedule.leadnest.ai"]',
      DATABASE_URL: 'postgresql://calcom_user:calcom_password@localhost:5432/calcom_db',
      DATABASE_DIRECT_URL: 'postgresql://calcom_user:calcom_password@localhost:5432/calcom_db',
      KEYCLOAK_CLIENT_ID: 'schedule.leadnest',
      KEYCLOAK_CLIENT_SECRET: 'oY6w5c4uvCj1KhBKQgO1y5WFy8Nkjpg2',
      KEYCLOAK_ISSUER: 'https://auth.leadnest.ai/realms/prod-leadnest-realm',
      GOOGLE_LOGIN_ENABLED: 'true',
      GOOGLE_API_CREDENTIALS: '{"web":{"client_id":"778638370742-rtc4oro1k5m8htlvsjc9otq8qnisri7e.apps.googleusercontent.com","project_id":"scheduley-484607","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_secret":"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","redirect_uris":["https://schedule.leadnest.ai/api/auth/callback/google","https://schedule.leadnest.ai/api/integrations/google/callback","https://schedule.leadnest.ai/api/integrations/googlecalendar/callback"]}}',
      NEXTAUTH_URL: 'https://schedule.leadnest.ai/api/auth',
      NEXTAUTH_SECRET: 'XF+Hws3A5g2eyWA5uGYYVJ74X+wrCWJ8oWo6kAfU6O8=',
      CALENDSO_ENCRYPTION_KEY: 'XF+Hws3A5g2eyWA5uGYYVJ74X+wrCWJ8oWo6kAfU6O8=',
      NEXT_PUBLIC_WEBAPP_URL: 'https://schedule.leadnest.ai',
      NEXTAUTH_TRUST_HOST: 'true',
      NODE_ENV: 'production',
      NODE_TLS_REJECT_UNAUTHORIZED: '0',
      PORT: '3000'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '4G',
    error_file: '/tmp/calcom-error.log',
    out_file: '/tmp/calcom-out.log',
    log_file: '/tmp/calcom-combined.log',
    time: true
  }]
};
