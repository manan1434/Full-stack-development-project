const axios = require('axios');

const FALLBACK_CATEGORY = 'Other';
// Render free tier sleeps after 15min idle and takes ~30s to wake.
// Generous timeout means a categorize-on-cold-start works instead of falling back to "Other".
const TIMEOUT_MS = 45000;

async function classifyExpense({ description, amount }) {
  const url = process.env.ML_SERVICE_URL;
  if (!url) {
    console.warn('[mlClient] ML_SERVICE_URL not set, defaulting to Other');
    return { category: FALLBACK_CATEGORY, confidence: 0 };
  }
  try {
    const { data } = await axios.post(
      `${url}/predict`,
      { description, amount },
      { timeout: TIMEOUT_MS }
    );
    return { category: data.category, confidence: data.confidence };
  } catch (err) {
    console.warn(`[mlClient] prediction failed: ${err.message}`);
    return { category: FALLBACK_CATEGORY, confidence: 0 };
  }
}

module.exports = { classifyExpense, FALLBACK_CATEGORY };
