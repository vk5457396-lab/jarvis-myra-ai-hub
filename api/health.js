import { createHandler } from './_middleware/handler.js';
import { success } from './_utils/response.js';

/** Lightweight liveness probe. It deliberately has no database dependencies. */
export default createHandler('GET', async (_req, res) =>
  success(res, { status: 'ok' }, 'Service healthy.')
);
