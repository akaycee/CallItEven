import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import { Chart } from 'chart.js';
import { SankeyController, Flow } from 'chartjs-chart-sankey';
import { Chart as ChartJS } from 'react-chartjs-2';
import { GRADIENT_EMERALD_ORANGE, cardBg, gradientText } from '../utils/themeConstants';

Chart.register(SankeyController, Flow);

const INCOME_COLORS = [
  '#10b981', '#06b6d4', '#22d3ee', '#34d399',
  '#2dd4bf', '#14b8a6', '#0d9488', '#059669',
];

const EXPENSE_COLORS = [
  '#f97316', '#ef4444', '#ec4899', '#f59e0b',
  '#e11d48', '#dc2626', '#d946ef', '#8b5cf6',
  '#f43f5e', '#fb923c',
];

const CashFlowSankey = React.memo(({ incomeBySource = [], expensesByCategory = [], totalIncome = 0 }) => {
  const theme = useTheme();

  if (incomeBySource.length === 0 && expensesByCategory.length === 0) {
    return (
      <Card
        sx={{
          background: cardBg.emeraldOrange(theme.palette.mode),
          borderRadius: 3,
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary">
            No cash flow data available for this period
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Add income and expenses to see your cash flow diagram
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Build Sankey data: Income Sources → Total Income → Expense Categories
  const dataPoints = [];

  // Income sources → Total Income
  incomeBySource.forEach((inc, i) => {
    dataPoints.push({
      from: `💰 ${inc.source}`,
      to: '💵 Total Income',
      flow: inc.total,
    });
  });

  // Total Income → Expense Categories
  expensesByCategory.forEach((exp, i) => {
    dataPoints.push({
      from: '💵 Total Income',
      to: `📦 ${exp.category}`,
      flow: exp.total,
    });
  });

  // If there are savings (income > expenses), show savings node
  const totalExpenses = expensesByCategory.reduce((sum, e) => sum + e.total, 0);
  const savings = totalIncome - totalExpenses;
  if (savings > 0) {
    dataPoints.push({
      from: '💵 Total Income',
      to: '🏦 Savings',
      flow: parseFloat(savings.toFixed(2)),
    });
  }

  // Build color map
  const colorMap = {};
  incomeBySource.forEach((inc, i) => {
    colorMap[`💰 ${inc.source}`] = INCOME_COLORS[i % INCOME_COLORS.length];
  });
  colorMap['💵 Total Income'] = '#06b6d4';
  expensesByCategory.forEach((exp, i) => {
    colorMap[`📦 ${exp.category}`] = EXPENSE_COLORS[i % EXPENSE_COLORS.length];
  });
  colorMap['🏦 Savings'] = '#10b981';

  const data = {
    datasets: [{
      data: dataPoints,
      colorFrom: (c) => {
        const from = dataPoints[c.dataIndex]?.from;
        return colorMap[from] || '#888';
      },
      colorTo: (c) => {
        const to = dataPoints[c.dataIndex]?.to;
        return colorMap[to] || '#888';
      },
      colorMode: 'gradient',
      labels: Object.fromEntries(
        Object.keys(colorMap).map(key => [key, key])
      ),
      borderWidth: 0,
      nodeWidth: 15,
      size: 'max',
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const item = ctx.dataset.data[ctx.dataIndex];
            return `${item.from} → ${item.to}: $${item.flow.toLocaleString()}`;
          },
        },
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        titleFont: { weight: 'bold', size: 14 },
        bodyFont: { size: 13 },
      },
    },
  };

  return (
    <Card
      sx={{
        background: cardBg.emeraldOrange(theme.palette.mode),
        backdropFilter: 'blur(20px)',
        borderRadius: 3,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 32px rgba(16, 185, 129, 0.15)'
          : '0 8px 32px rgba(16, 185, 129, 0.2)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          sx={{
            mb: 3,
            fontWeight: 700,
            ...gradientText(GRADIENT_EMERALD_ORANGE),
          }}
        >
          Cash Flow Diagram
        </Typography>
        <Box sx={{ position: 'relative', height: 400 }}>
          <ChartJS type="sankey" data={data} options={options} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10b981' }} />
            <Typography variant="caption" color="text.secondary">Income</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#06b6d4' }} />
            <Typography variant="caption" color="text.secondary">Total</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f97316' }} />
            <Typography variant="caption" color="text.secondary">Expenses</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

export default CashFlowSankey;
