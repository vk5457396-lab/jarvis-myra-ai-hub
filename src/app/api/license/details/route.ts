export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextRequest } from 'next/server';
import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireAdmin } from '../../_lib/middleware/admin';
import { success } from '../../_lib/utils/response';
import { licenseDetails } from '../../_lib/services/licenseService';
import { validateLicenseKey } from '../../_lib/utils/validation';

export const OPTIONS = handleOptions(['GET', 'POST']);

/** POST /api/license/details  { license_key }  (GET /api/license/details?license_key=... also works) */
async function core(req: NextRequest) {
  await requireAdmin(req);

  const url = new URL(req.url);
  const bodyKey = req.method === 'POST' ? (await req.json())?.license_key : undefined;
  const raw = bodyKey || url.searchParams.get('license_key');
  const licenseKey = validateLicenseKey(raw);
  const license = await licenseDetails(licenseKey);
  return success({ license }, 'License details.');
}

const handler = withApi(core, { rateLimit: { scope: 'license-admin', max: 60 } });

export const GET = handler;
export const POST = handler;
