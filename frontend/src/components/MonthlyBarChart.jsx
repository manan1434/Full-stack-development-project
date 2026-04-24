import { Bar } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function MonthlyBarChart({ series }) {
  if (!series?.length) {
    return <div className="empty">No data yet.</div>;
  }

  const data = {
    labels: series.map((r) => r.month),
    datasets: [
      {
        label: 'Total spent',
        data: series.map((r) => r.total),
        backgroundColor: '#6366f1',
        borderRadius: 6,
      },
    ],
  };

  const options = {
    plugins: { legend: { display: false } },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  return (
    <div className="chart-container">
      <Bar data={data} options={options} />
    </div>
  );
}
