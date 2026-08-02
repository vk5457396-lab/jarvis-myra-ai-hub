import { createHandler } from './_middleware/handler.js';
import { failure } from './_utils/response.js';

/**
 * Catch-all so an unknown /api/* path returns JSON instead of an HTML 404 page.
 * Vercel matches concrete routes before this file.
 */
export default createHandler(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], async (req, res) =>
  failure(res, 404, 'Endpoint not found.', 'ENDPOINT_NOT_FOUND', { path: req.url })
);
