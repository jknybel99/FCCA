import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Grid, LinearProgress } from '@mui/material';
import { MonitorHeart, Memory, Storage, ThermostatAuto } from '@mui/icons-material';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

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
    scales: { y: { beginAtZero: true, max: 100 }, x: { ticks: { maxRotation: 45, font: { size: 9 } } } }
  };

  return (
    <Card sx={{ boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MonitorHeart color="primary" /> System Performance
        </Typography>
        <Box sx={{ height: 180, mb: 2 }}><Line data={chartData} options={opts} /></Box>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.default' }}>
              <Typography variant="caption" color="text.secondary">CPU</Typography>
              <Typography variant="h6" sx={{ color: getColor(systemStats?.cpu_percent || 0) }}>
                {systemStats?.cpu_percent || 0}%
              </Typography>
              <LinearProgress variant="determinate" value={systemStats?.cpu_percent || 0} 
                sx={{ mt: 1, height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { bgcolor: getColor(systemStats?.cpu_percent || 0) } }} />
              <Typography variant="caption" color="text.secondary">{systemStats?.cpu_temp || 'N/A'}°C</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.default' }}>
              <Typography variant="caption" color="text.secondary">Memory</Typography>
              <Typography variant="h6" sx={{ color: getColor(systemStats?.memory_percent || 0) }}>
                {systemStats?.memory_percent || 0}%
              </Typography>
              <LinearProgress variant="determinate" value={systemStats?.memory_percent || 0} 
                sx={{ mt: 1, height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { bgcolor: getColor(systemStats?.memory_percent || 0) } }} />
              <Typography variant="caption" color="text.secondary">{systemStats?.memory_used_gb || 0} GB</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.default' }}>
              <Typography variant="caption" color="text.secondary">Storage</Typography>
              <Typography variant="h6" sx={{ color: getColor(systemStats?.disk_percent || 0) }}>
                {systemStats?.disk_percent || 0}%
              </Typography>
              <LinearProgress variant="determinate" value={systemStats?.disk_percent || 0} 
                sx={{ mt: 1, height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { bgcolor: getColor(systemStats?.disk_percent || 0) } }} />
              <Typography variant="caption" color="text.secondary">{systemStats?.disk_free_gb || 0} GB free</Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SystemStatsChart;
