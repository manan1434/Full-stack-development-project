import { useCallback, useEffect, useState } from 'react';
import client from '../api/client';
import BudgetForm from '../components/BudgetForm';

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await client.get('/budgets');
      setBudgets(data.budgets);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Budgets</h1>
          <p className="muted">Set a monthly limit per category. You'll be alerted on the dashboard if you exceed it.</p>
        </div>
      </header>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? <div className="muted">Loading…</div> : <BudgetForm budgets={budgets} onSaved={load} />}
    </div>
  );
}
