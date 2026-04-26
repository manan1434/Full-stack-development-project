import { useCallback, useEffect, useState } from 'react';
import client, { CATEGORY_COLORS } from '../api/client';
import BudgetAlert from '../components/BudgetAlert';
import CategoryPieChart from '../components/CategoryPieChart';
import MonthlyBarChart from '../components/MonthlyBarChart';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const SAMPLE_SEEDS = [
  { amount: 450, description: 'Zomato dinner order' },
  { amount: 120, description: 'Starbucks coffee' },
  { amount: 800, description: 'Weekly grocery run' },
  { amount: 250, description: 'Uber ride home' },
  { amount: 90, description: 'Metro card recharge' },
  { amount: 1800, description: 'Petrol fuel refill' },
  { amount: 2499, description: 'Amazon headphones' },
  { amount: 1299, description: 'Myntra jeans' },
  { amount: 599, description: 'Nike shoes' },
  { amount: 2200, description: 'Electricity bill payment' },
  { amount: 350, description: 'Internet bill Jio fiber' },
  { amount: 1500, description: 'DTH recharge' },
  { amount: 499, description: 'Netflix subscription' },
  { amount: 199, description: 'Spotify premium' },
  { amount: 700, description: 'Movie ticket PVR' },
  { amount: 250, description: 'Paracetamol tablets' },
  { amount: 1500, description: 'Doctor consultation fee' },
  { amount: 999, description: 'Gym membership Cult fit' },
  { amount: 2499, description: 'Udemy course purchase' },
  { amount: 399, description: 'Kindle unlimited' },
];

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, m] = await Promise.all([
        client.get('/analytics/summary', { params: { month } }),
        client.get('/analytics/monthly', { params: { months: 6 } }),
      ]);
      setSummary(s.data);
      setSeries(m.data.series);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const seedDemo = async () => {
    setSeeding(true);
    try {
      for (const s of SAMPLE_SEEDS) {
        // eslint-disable-next-line no-await-in-loop
        await client.post('/expenses', s);
      }
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Seeding failed');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Overview of your spending for the selected month.</p>
        </div>
        <div className="controls">
          <label>
            Month
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </label>
          <button className="btn btn-ghost" onClick={seedDemo} disabled={seeding}>
            {seeding ? 'Seeding…' : 'Seed demo data'}
          </button>
        </div>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div className="muted">Loading…</div>}

      {summary && !loading && (
        <>
          <BudgetAlert budgets={summary.budgets} />
          <div className="dashboard-grid">
            <div className="card stat">
              <div className="stat-label">Total spent</div>
              <div className="stat-value">₹{summary.total.toFixed(2)}</div>
              <div className="muted small">{summary.month}</div>
            </div>

            <div className="card">
              <h3>By category</h3>
              <CategoryPieChart byCategory={summary.byCategory} />
            </div>

            <div className="card">
              <h3>Last 6 months</h3>
              <MonthlyBarChart series={series} />
            </div>

            <div className="card">
              <h3>Category breakdown</h3>
              {summary.byCategory.length === 0 ? (
                <div className="empty">No expenses this month.</div>
              ) : (
                <ul className="category-breakdown">
                  {summary.byCategory.map((r) => (
                    <li key={r.category}>
                      <span
                        className="category-pill"
                        style={{ background: CATEGORY_COLORS[r.category] }}
                      >
                        {r.category}
                      </span>
                      <span className="grow muted small">{r.count} expense{r.count === 1 ? '' : 's'}</span>
                      <strong>₹{r.total.toFixed(2)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
