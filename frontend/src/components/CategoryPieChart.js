import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement } from 'chart.js';

Chart.register(ArcElement);

export const CategoryPieChart = ({
  categoryData,
  chartOptions,
  hoveredCategory,
  onCategoryHover,
  onCategoryClick,
  formatCurrency,
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)'
          : 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: 3,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 8px 32px rgba(249, 115, 22, 0.15)' 
          : '0 8px 32px rgba(249, 115, 22, 0.2)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.2)'}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 12px 48px rgba(249, 115, 22, 0.25)' 
            : '0 12px 48px rgba(249, 115, 22, 0.3)',
        },
      }}
    >
      <CardContent>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 3,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #f97316 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Expenses by Category
        </Typography>
        <Box sx={{ position: 'relative', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {categoryData.labels.length > 0 ? (
            <>
              <Pie data={categoryData} options={chartOptions} />
              {hoveredCategory && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.95) 0%, rgba(6, 182, 212, 0.95) 100%)'
                      : 'linear-gradient(135deg, rgba(249, 115, 22, 0.98) 0%, rgba(6, 182, 212, 0.98) 100%)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    minWidth: 200,
                    textAlign: 'center',
                    animation: 'floatIn 0.3s ease-out',
                    '@keyframes floatIn': {
                      from: {
                        opacity: 0,
                        transform: 'translateX(-50%) translateY(10px)',
                      },
                      to: {
                        opacity: 1,
                        transform: 'translateX(-50%) translateY(0)',
                      },
                    },
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {hoveredCategory.label}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatCurrency(hoveredCategory.value)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {hoveredCategory.percentage}%
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No expenses in this period
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
