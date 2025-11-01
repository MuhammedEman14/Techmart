/**
 * SalesChart Component
 * Displays sales performance chart using Chart.js
 */

import React, { useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SalesChart = ({ data, loading, error, title = 'Sales Performance (Last 24 Hours)' }) => {
  const chartRef = useRef(null);

  // Prepare chart data
  const chartData = {
    labels: data?.data?.map((item) => {
      const date = new Date(item.time_period);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }) || [],
    datasets: [
      {
        label: 'Sales ($)',
        data: data?.data?.map((item) => parseFloat(item.total_sales || 0)) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Transactions',
        data: data?.data?.map((item) => parseInt(item.transaction_count || 0)) || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y1',
      },
    ],
  };

  // Chart options
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
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.dataset.label === 'Sales ($)') {
                label += '$' + context.parsed.y.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Sales Amount ($)',
        },
        ticks: {
          callback: function (value) {
            return '$' + value.toLocaleString('en-US');
          },
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Transaction Count',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
    },
  };

  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  if (loading) {
    return (
      <Card sx={{ height: 400 }}>
        <CardHeader title={title} />
        <CardContent>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height={300}
          >
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: 400 }}>
        <CardHeader title={title} />
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: 400 }}>
      <CardHeader
        title={title}
        subheader={data?.summary ? `Total: $${parseFloat(data.summary.total_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : ''}
      />
      <CardContent>
        <Box height={300}>
          <Line ref={chartRef} data={chartData} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default SalesChart;