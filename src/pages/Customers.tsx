import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useAuthenticatedAxios } from '../lib/axios';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  creditLimit?: number;
  notes?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxNumber: '',
    creditLimit: 0,
    notes: '',
  });

  const axios = useAuthenticatedAxios();

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setOpenViewDialog(true);
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phone', headerName: 'Phone', width: 150 },
    { field: 'address', headerName: 'Address', width: 250 },
    { field: 'taxNumber', headerName: 'Tax Number', width: 150 },
    { field: 'creditLimit', headerName: 'Credit Limit', width: 150, type: 'number' },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="View Details">
          <IconButton
            onClick={() => handleViewCustomer(params.row)}
            size="small"
          >
            <ViewIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/customers', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
        },
      });
      setCustomers(response.data.data.customers);
      setPagination(response.data.data.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to fetch customers');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, pagination.limit]);

  const handleAddCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      await axios.post('/customers', newCustomer);
      setOpenAddDialog(false);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        address: '',
        taxNumber: '',
        creditLimit: 0,
        notes: '',
      });
      fetchCustomers();
    } catch (err) {
      setError('Failed to add customer. Please try again.');
      console.error('Error adding customer:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Customers</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenAddDialog(true)}
        >
          Add Customer
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 400, width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={customers}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: pagination.limit, page: pagination.page - 1 },
              },
            }}
            pageSizeOptions={[5, 10, 25]}
            rowCount={pagination.total}
            paginationMode="server"
            onPaginationModelChange={(model) => {
              setPagination(prev => ({ ...prev, page: model.page + 1, limit: model.pageSize }));
            }}
            disableRowSelectionOnClick
          />
        )}
      </Box>

      {/* Add Customer Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tax Number"
                value={newCustomer.taxNumber}
                onChange={(e) => setNewCustomer({ ...newCustomer, taxNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Credit Limit"
                type="number"
                value={newCustomer.creditLimit}
                onChange={(e) => setNewCustomer({ ...newCustomer, creditLimit: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={newCustomer.notes}
                onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddCustomer} variant="contained" disabled={!newCustomer.name}>
            Add Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Customer Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Customer Details</DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Name</Typography>
                <Typography>{selectedCustomer.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Email</Typography>
                <Typography>{selectedCustomer.email || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Phone</Typography>
                <Typography>{selectedCustomer.phone || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Tax Number</Typography>
                <Typography>{selectedCustomer.taxNumber || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Address</Typography>
                <Typography>{selectedCustomer.address || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Credit Limit</Typography>
                <Typography>{selectedCustomer.creditLimit || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Notes</Typography>
                <Typography>{selectedCustomer.notes || 'N/A'}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers; 