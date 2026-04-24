import { Doughnut } from 'react-chartjs-2';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { CATEGORY_COLORS } from '../api/client';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CategoryPieChart({ byCategory }) {
  if (!byCategory?.length) {
    return <div className="empty">No spending this month yet.</div>;
  }

  const data = {
    labels: byCategory.map((r) => r.category),
    datasets: [
      {
        data: byCategory.map((r) => r.total),
        backgroundColor: byCategory.map((r) => CATEGORY_COLORS[r.category] || '#64748b'),
        borderWidth: 0,
      },
    ],
  };

  const options = {
    plugins: {
      legend: { position: 'bottom', labels: { padding: 12 } },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="chart-container">
      <Doughnut data={data} options={options} />
    </div>
  );
}
