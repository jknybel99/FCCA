import React, { useState, useEffect } from 'react';
import { Typography, Box } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Title, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Title, Legend);

const SystemStatsChart = ({ systemStats }) => {
  const [cpuHistory, setCpuHistory] = useState([]);
  const [memHistory, setMemHistory] = useState([]);
  const [times, setTimes] = useState([]);

  useEffect(() => {
    if (systemStats) {
      const now = new Date().toLocaleTimeString();
      setCpuHistory(p => [...p, systemStats.cpu_percent || 0].slice(-20));
      setMemHistory(p => [...p, systemStats.memory_percent || 0].slice(-20));
      setTimes(p => [...p, now].slice(-20));
    }
  }, [systemStats]);

  const getColor = (v) => v >= 90 ? '#f44336' : v >= 70 ? '#ff9800' : '#4caf50';

  const chartData = {
    labels: times,
    datasets: [
      { label: 'CPU %', data: cpuHistory, borderColor: '#1976d2', backgroundColor: '#1976d220', fill: true, tension: 0.4 },
      { label: 'RAM %', data: memHistory, borderColor: '#9c27b0', backgroundColor: '#9c27b020', fill: true, tension: 0.4 }
    ]
  };

  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { 
          boxWidth: 15, 
          font: { size: 11 }, 
          padding: 8,
          usePointStyle: true
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { font: { size: 10 } },
        grid: { display: true },
        title: {
          display: true,
          text: 'Usage %',
          font: { size: 10 }
        }
      },
      x: {
        display: false
      }
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <Line data={chartData} options={opts} />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 0.5, gap: 0.5 }}>
        <Box sx={{ textAlign: 'center', minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" fontSize="11px" sx={{ lineHeight: 1.2 }}>
            CPU: <strong style={{ color: getColor(systemStats?.cpu_percent || 0) }}>{systemStats?.cpu_percent || 0}%</strong> {systemStats?.cpu_temp || 'N/A'}°C
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" fontSize="11px" sx={{ lineHeight: 1.2 }}>
            RAM: <strong style={{ color: getColor(systemStats?.memory_percent || 0) }}>{systemStats?.memory_percent || 0}%</strong> {systemStats?.memory_used_gb || 0}GB
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" fontSize="11px" sx={{ lineHeight: 1.2 }}>
            Storage: <strong style={{ color: getColor(systemStats?.disk_percent || 0) }}>{systemStats?.disk_percent || 0}%</strong> {systemStats?.disk_free_gb || 0}GB
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" fontSize="11px" sx={{ lineHeight: 1.2 }}>
            Uptime: <strong>{systemStats?.uptime_days || 0}d {systemStats?.uptime_hours || 0}h</strong>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default SystemStatsChart;
