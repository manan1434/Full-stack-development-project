import { useState } from 'react';
import client, { CATEGORIES, CATEGORY_COLORS } from '../api/client';

export default function BudgetForm({ budgets, onSaved }) {
  const existing = Object.fromEntries(budgets.map((b) => [b.category, b.monthlyLimit]));
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(CATEGORIES.map((c) => [c, existing[c] ?? '']))
  );
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  const save = async (category) => {
    const raw = drafts[category];
    const value = Number(raw);
    if (raw === '' || Number.isNaN(value) || value < 0) {
      setError('Enter a non-negative number');
      return;
    }
    setBusy(category);
    setError('');
    try {
      await client.put('/budgets', { category, monthlyLimit: value });
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="card">
      <h3>Monthly budgets</h3>
      {error && <div className="error small">{error}</div>}
      <div className="budget-list">
        {CATEGORIES.map((c) => (
          <div key={c} className="budget-row">
            <span
              className="category-pill"
              style={{ background: CATEGORY_COLORS[c] }}
            >
              {c}
            </span>
            <label className="grow">
              <span className="muted small">₹ per month</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={drafts[c]}
                onChange={(e) => setDrafts({ ...drafts, [c]: e.target.value })}
              />
            </label>
            <button
              className="btn btn-primary"
              disabled={busy === c}
              onClick={() => save(c)}
            >
              {busy === c ? 'Saving…' : 'Save'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
