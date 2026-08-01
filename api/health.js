import { createHandler } from './_middleware/handler.js';
import { success } from './_utils/response.js';

export default createHandler(['GET', 'POST'], async (req, res) =>
  success(
    res,
    {
      status: 'ok',
      service: 'myra-api',
      time: new Date().toISOString(),
      uptime_seconds: Math.round(process.uptime()),
    },
    'Service healthy.'
  )
);
