import React, { useEffect, useState } from 'react';
import { useAuthenticatedAxios } from '../lib/axios';
import { Box, Typography, CircularProgress } from '@mui/material';

interface SalesData {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
}

const Dashboard: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const axios = useAuthenticatedAxios();

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const response = await axios.get('/sales/summary');
        setSalesData(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch sales data');
        console.error('Error fetching sales data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [axios]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      {salesData && (
        <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={3}>
          <Box p={3} bgcolor="background.paper" borderRadius={1}>
            <Typography variant="h6" gutterBottom>
              Total Sales
            </Typography>
            <Typography variant="h4">
              ${salesData.totalSales.toFixed(2)}
            </Typography>
          </Box>
          <Box p={3} bgcolor="background.paper" borderRadius={1}>
            <Typography variant="h6" gutterBottom>
              Total Orders
            </Typography>
            <Typography variant="h4">
              {salesData.totalOrders}
            </Typography>
          </Box>
          <Box p={3} bgcolor="background.paper" borderRadius={1}>
            <Typography variant="h6" gutterBottom>
              Average Order Value
            </Typography>
            <Typography variant="h4">
              ${salesData.averageOrderValue.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard; 