export default function BudgetAlert({ budgets }) {
  const over = budgets?.filter((b) => b.overBudget) || [];
  if (!over.length) return null;

  return (
    <div className="alert alert-danger">
      <strong>⚠ Over budget:</strong>
      <ul>
        {over.map((b) => (
          <li key={b.category}>
            {b.category}: spent ₹{b.spent.toFixed(0)} of ₹{b.monthlyLimit.toFixed(0)} limit
          </li>
        ))}
      </ul>
    </div>
  );
}
