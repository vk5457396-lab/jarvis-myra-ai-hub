import { createHandler } from './_middleware/handler.js';
import { success } from './_utils/response.js';

/**
 * Startup / configuration validation. Never throws, never returns HTML.
 * Only reports whether a variable is present - never its value.
 */
function configReport() {
  const has = (name) => Boolean(process.env[name] && String(process.env[name]).trim());
  const config = {
    supabase_url: has('SUPABASE_URL') || has('VITE_SUPABASE_URL'),
    supabase_service_role_key: has('SUPABASE_SERVICE_ROLE_KEY'),
    jwt_secret: has('JWT_SECRET'),
    admin_api_key: has('ADMIN_API_KEY'),
    firebase_service_account:
      has('FIREBASE_SERVICE_ACCOUNT') ||
      has('FIREBASE_SERVICE_ACCOUNT_JSON') ||
      has('FIREBASE_SERVICE_ACCOUNT_BASE64'),
  };
  const required = ['supabase_url', 'supabase_service_role_key', 'jwt_secret'];
  const missing = required.filter((k) => !config[k]);
  return { config, missing };
}

export default createHandler(['GET', 'POST'], async (req, res) => {
  const { config, missing } = configReport();
  return success(
    res,
    {
      status: missing.length ? 'degraded' : 'ok',
      service: 'myra-api',
      runtime: `node-${process.versions.node}`,
      time: new Date().toISOString(),
      uptime_seconds: Math.round(process.uptime()),
      config,
      missing_env: missing,
    },
    missing.length ? 'Service reachable but misconfigured.' : 'Service healthy.'
  );
});
