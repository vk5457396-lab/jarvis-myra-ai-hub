export const runtime = 'nodejs';

import { withApi, handleOptions } from '../_lib/middleware/handler';
import { success } from '../_lib/utils/response';

export const OPTIONS = handleOptions(['GET']);

export const GET = withApi(async () => success({ status: 'ok' }, 'Service healthy.'));
