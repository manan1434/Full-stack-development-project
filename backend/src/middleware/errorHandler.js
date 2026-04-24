// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  if (status >= 500) {
    console.error('[error]', err);
  }

  const body = { error: err.expose || status < 500 ? err.message : 'Internal server error' };
  if (!isProd && status >= 500) {
    body.stack = err.stack;
  }
  res.status(status).json(body);
}

module.exports = { errorHandler };
