const COOKIE_NAME = 'token';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SEVEN_DAYS_MS,
    path: '/',
  };
}

module.exports = { COOKIE_NAME, cookieOptions, SEVEN_DAYS_MS };
