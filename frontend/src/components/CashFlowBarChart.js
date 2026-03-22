import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineController,
  BarController,
} from 'chart.js';

Chart.register(
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineController,
  BarController,
);

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const formatMonthLabel = (monthStr) => {
  // monthStr is "2026-03"
  const [year, month] = monthStr.split('-');
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
};

const CashFlowBarChart = React.memo(({ monthly = [] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (monthly.length === 0) {
    return (
      <Card
        sx={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
          borderRadius: 3,
          border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary">
            No monthly data available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Select a broader date range to see trends
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const labels = monthly.map(m => formatMonthLabel(m.month));

  const data = {
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Income',
        data: monthly.map(m => m.income),
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.7)' : 'rgba(16, 185, 129, 0.8)',
        borderColor: '#10b981',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.7,
        categoryPercentage: 0.6,
        order: 2,
      },
      {
        type: 'bar',
        label: 'Expenses',
        data: monthly.map(m => m.expenses),
        backgroundColor: isDark ? 'rgba(249, 115, 22, 0.7)' : 'rgba(249, 115, 22, 0.8)',
        borderColor: '#f97316',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.7,
        categoryPercentage: 0.6,
        order: 3,
      },
      {
        type: 'line',
        label: 'Net Savings',
        data: monthly.map(m => m.net),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: isDark ? '#1e1e1e' : '#fff',
        pointBorderWidth: 2,
        tension: 0.3,
        fill: false,
        order: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme.palette.text.primary,
          font: { weight: 'bold', size: 12 },
          usePointStyle: true,
          pointStyle: 'roundRect',
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        titleFont: { weight: 'bold', size: 14 },
        bodyFont: { size: 13 },
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed.y;
            const prefix = value >= 0 ? '+' : '';
            return `${ctx.dataset.label}: ${prefix}$${Math.abs(value).toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: { weight: '600' },
        },
      },
      y: {
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: { weight: '600' },
          callback: (value) => `$${value.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <Card
      sx={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)'
          : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: 3,
        boxShadow: isDark
          ? '0 8px 32px rgba(139, 92, 246, 0.15)'
          : '0 8px 32px rgba(139, 92, 246, 0.2)',
        border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          sx={{
            mb: 3,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Income vs Expenses Over Time
        </Typography>
        <Box sx={{ position: 'relative', height: 350 }}>
          <Bar data={data} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
});

export default CashFlowBarChart;
