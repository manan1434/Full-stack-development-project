import { useState } from 'react';
import client from '../api/client';

const today = () => new Date().toISOString().slice(0, 10);

export default function ExpenseForm({ onCreated }) {
  const [form, setForm] = useState({ amount: '', description: '', date: today() });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const validate = () => {
    setWarn('');
    setError('');
    if (!form.description.trim()) {
      setError('Description is required');
      return false;
    }
    const amt = Number(form.amount);
    if (Number.isNaN(amt) || amt < 0) {
      setError('Amount must be a non-negative number');
      return false;
    }
    if (form.date && new Date(form.date) > new Date()) {
      setWarn('Heads up: that date is in the future.');
    }
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { data } = await client.post('/expenses', {
        amount: Number(form.amount),
        description: form.description.trim(),
        date: form.date ? new Date(form.date).toISOString() : undefined,
      });
      setForm({ amount: '', description: '', date: today() });
      onCreated?.(data.expense);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="card expense-form" onSubmit={onSubmit}>
      <h3>Add expense</h3>
      <div className="form-row">
        <label>
          Amount (₹)
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={form.amount}
            onChange={(e) => update({ amount: e.target.value })}
          />
        </label>
        <label className="grow">
          Description
          <input
            type="text"
            required
            placeholder="e.g. Zomato dinner"
            value={form.description}
            onChange={(e) => update({ description: e.target.value })}
          />
        </label>
        <label>
          Date
          <input
            type="date"
            value={form.date}
            onChange={(e) => update({ date: e.target.value })}
          />
        </label>
        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Add'}
        </button>
      </div>
      {warn && <div className="warn small">{warn}</div>}
      {error && <div className="error small">{error}</div>}
      <p className="muted small">The AI will auto-categorize your expense — you can override it below.</p>
    </form>
  );
}
