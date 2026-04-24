import { useCallback, useEffect, useState } from 'react';
import client, { CATEGORIES } from '../api/client';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(currentMonth());
  const [category, setCategory] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (month) params.month = month;
      if (category) params.category = category;
      const { data } = await client.get('/expenses', { params });
      setExpenses(data.expenses);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [month, category]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Expenses</h1>
          <p className="muted">Add, edit, and categorize your expenses.</p>
        </div>
        <div className="controls">
          <label>
            Month
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <ExpenseForm onCreated={load} />

      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div className="muted">Loading…</div>
      ) : (
        <ExpenseList expenses={expenses} onChange={load} />
      )}
    </div>
  );
}
