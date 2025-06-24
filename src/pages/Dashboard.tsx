import React, { useEffect, useState } from 'react';
import { useAuthenticatedAxios } from '../lib/axios';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Card, 
  CardContent,
  Grid,
} from '@mui/material';
import { 
  AttachMoney, 
  ShoppingCart, 
  TrendingUp 
} from '@mui/icons-material';

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
        setSalesData(response.data.data);
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
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Dashboard
      </Typography>
      
      {salesData && (
        <Grid container spacing={3}>
          {/* Total Sales Card */}
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              elevation={2}
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                '&:hover': {
                  elevation: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease-in-out'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>
                      Total Sales
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      ${(salesData.totalSales || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <AttachMoney sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Orders Card */}
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              elevation={2}
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                '&:hover': {
                  elevation: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease-in-out'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>
                      Total Orders
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {salesData.totalOrders || 0}
                    </Typography>
                  </Box>
                  <ShoppingCart sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Average Order Value Card */}
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              elevation={2}
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                '&:hover': {
                  elevation: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease-in-out'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>
                      Average Order Value
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      ${(salesData.averageOrderValue || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard; 