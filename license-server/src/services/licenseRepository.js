'use strict';

const supabase = require('../database/supabaseClient');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const TABLE = 'licenses';

function handle(error, context) {
  if (!error) return;
  logger.error(`Supabase error during ${context}`, { code: error.code, message: error.message });
  throw ApiError.internal('License service temporarily unavailable.');
}

async function findByKey(licenseKey) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('license_key', licenseKey)
    .maybeSingle();
  handle(error, 'findByKey');
  return data || null;
}

async function findById(id) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
  handle(error, 'findById');
  return data || null;
}

async function update(id, patch) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  handle(error, 'update');
  return data || null;
}

/**
 * Claims a license for a device only if it is still unclaimed.
 * The `is('device_id', null)` guard makes the activation atomic, preventing
 * two devices from claiming the same key concurrently.
 */
async function claimForDevice(id, patch) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .is('device_id', null)
    .select('*')
    .maybeSingle();
  handle(error, 'claimForDevice');
  return data || null;
}

async function ping() {
  const { error } = await supabase.from(TABLE).select('id', { head: true, count: 'exact' }).limit(1);
  return !error;
}

module.exports = { findByKey, findById, update, claimForDevice, ping };
