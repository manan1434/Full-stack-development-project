import { useState } from 'react';
import client, { CATEGORIES, CATEGORY_COLORS } from '../api/client';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function ExpenseList({ expenses, onChange }) {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const changeCategory = async (expense, category) => {
    setBusyId(expense._id);
    setError('');
    try {
      await client.put(`/expenses/${expense._id}`, { category });
      onChange?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (expense) => {
    if (!confirm('Delete this expense?')) return;
    setBusyId(expense._id);
    setError('');
    try {
      await client.delete(`/expenses/${expense._id}`);
      onChange?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
    } finally {
      setBusyId(null);
    }
  };

  if (!expenses?.length) {
    return <div className="empty">No expenses yet. Add one above.</div>;
  }

  return (
    <div className="card">
      <h3>Your expenses</h3>
      {error && <div className="error small">{error}</div>}
      <div className="expense-table-wrap">
        <table className="expense-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th className="right">Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e._id} className={busyId === e._id ? 'dim' : ''}>
                <td>{formatDate(e.date)}</td>
                <td>{e.description}</td>
                <td>
                  <select
                    value={e.category}
                    disabled={busyId === e._id}
                    onChange={(ev) => changeCategory(e, ev.target.value)}
                    style={{
                      borderLeft: `4px solid ${CATEGORY_COLORS[e.category] || '#64748b'}`,
                    }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="right">₹{e.amount.toFixed(2)}</td>
                <td>
                  <button
                    className="btn btn-ghost small"
                    disabled={busyId === e._id}
                    onClick={() => remove(e)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
