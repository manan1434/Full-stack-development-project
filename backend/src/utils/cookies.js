const COOKIE_NAME = 'token';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  // In production the frontend (Vercel) and backend (Render) sit on
  // different domains. Cross-site cookies require SameSite=None, which
  // browsers only accept when Secure=true. In dev keep SameSite=Lax.
  return {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    maxAge: SEVEN_DAYS_MS,
    path: '/',
  };
}

module.exports = { COOKIE_NAME, cookieOptions, SEVEN_DAYS_MS };
