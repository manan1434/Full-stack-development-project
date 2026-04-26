const axios = require('axios');

const FALLBACK_CATEGORY = 'Other';
// Render free tier sleeps after 15min idle and takes ~30s to wake.
// Generous timeout means a categorize-on-cold-start works instead of falling back to "Other".
const TIMEOUT_MS = 45000;
// Render's free tier rate-limits HTTP traffic. Retry on 429 with backoff.
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 800;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callPredict(url, body) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const { data } = await axios.post(`${url}/predict`, body, { timeout: TIMEOUT_MS });
      return data;
    } catch (err) {
      const status = err.response?.status;
      const isRateLimited = status === 429;
      const isLastAttempt = attempt === MAX_RETRIES;
      if (!isRateLimited || isLastAttempt) throw err;
      // Exponential backoff: 800ms, 1600ms, 3200ms
      const wait = RETRY_BASE_MS * 2 ** attempt;
      console.warn(`[mlClient] 429 from ML service, retry ${attempt + 1}/${MAX_RETRIES} in ${wait}ms`);
      await sleep(wait);
    }
  }
  // Unreachable — loop either returns or throws.
  throw new Error('mlClient retry loop exhausted');
}

async function classifyExpense({ description, amount }) {
  const url = process.env.ML_SERVICE_URL;
  if (!url) {
    console.warn('[mlClient] ML_SERVICE_URL not set, defaulting to Other');
    return { category: FALLBACK_CATEGORY, confidence: 0 };
  }
  try {
    const data = await callPredict(url, { description, amount });
    return { category: data.category, confidence: data.confidence };
  } catch (err) {
    console.warn(`[mlClient] prediction failed: ${err.message}`);
    return { category: FALLBACK_CATEGORY, confidence: 0 };
  }
}

module.exports = { classifyExpense, FALLBACK_CATEGORY };
