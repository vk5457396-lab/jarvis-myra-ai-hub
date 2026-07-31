'use strict';

const { createClient } = require('@supabase/supabase-js');
const env = require('../config/env');

/**
 * Server-side Supabase client using the service role key.
 * This key is loaded from the environment and is never sent to any client.
 */
const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: { 'x-application-name': 'myra-license-server' },
  },
});

module.exports = supabase;
