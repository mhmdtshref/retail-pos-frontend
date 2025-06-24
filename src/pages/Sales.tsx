import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Autocomplete,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useAuthenticatedAxios } from '../lib/axios';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Item {
  id: string;
  code: string;
  sku: string;
  variants: {
    id: string;
    code: string;
    price: number;
    stockQuantity: number;
  }[];
}

interface SaleItem {
  itemId: string;
  itemVariantId: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  notes?: string;
}

interface Sale {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  status: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  items: SaleItem[];
  notes?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  // New sale dialog states
  const [openNewSaleDialog, setOpenNewSaleDialog] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [paymentStatus, setPaymentStatus] = useState<string>('PAID');
  const [notes, setNotes] = useState<string>('');

  // View sale dialog states
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const axios = useAuthenticatedAxios();

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'Transaction ID', width: 130 },
    { field: 'date', headerName: 'Date', width: 180 },
    { field: 'customerName', headerName: 'Customer', width: 200 },
    { 
      field: 'items', 
      headerName: 'Items', 
      width: 130, 
      valueGetter: (params) => params.row.items.length 
    },
    { field: 'finalAmount', headerName: 'Total', width: 130, type: 'number' },
    { field: 'status', headerName: 'Status', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="View Details">
          <IconButton
            onClick={() => handleViewSale(params.row)}
            size="small"
          >
            <ViewIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/sales', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
        },
      });
      setSales(response.data.data.sales);
      setPagination(response.data.data.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to fetch sales');
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/customers');
      setCustomers(response.data.data.customers);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await axios.get('/items/search');
      setItems(response.data.data.items);
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    if (openNewSaleDialog) {
      fetchCustomers();
      fetchItems();
    }
  }, [openNewSaleDialog]);

  const handleAddItem = (item: Item, variant: Item['variants'][0]) => {
    setSelectedItems([
      ...selectedItems,
      {
        itemId: item.id,
        itemVariantId: variant.id,
        quantity: 1,
        unitPrice: variant.price,
        discountAmount: 0,
        taxAmount: 0,
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof SaleItem, value: number) => {
    const newItems = [...selectedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setSelectedItems(newItems);
  };

  const handleCreateSale = async () => {
    try {
      setLoading(true);
      setError(null);
      await axios.post('/sales', {
        customerId: selectedCustomer?.id,
        items: selectedItems,
        paymentMethod,
        paymentStatus,
        notes,
      });
      setOpenNewSaleDialog(false);
      resetNewSaleForm();
      fetchSales();
    } catch (err) {
      setError('Failed to create sale');
      console.error('Error creating sale:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setOpenViewDialog(true);
  };

  const resetNewSaleForm = () => {
    setSelectedCustomer(null);
    setSelectedItems([]);
    setPaymentMethod('CASH');
    setPaymentStatus('PAID');
    setNotes('');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Sales</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenNewSaleDialog(true)}
        >
          New Sale
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
            rows={sales}
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

      {/* New Sale Dialog */}
      <Dialog open={openNewSaleDialog} onClose={() => setOpenNewSaleDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Sale</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => option.name}
                value={selectedCustomer}
                onChange={(_, newValue) => setSelectedCustomer(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer"
                    required
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>Items</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Variant</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>Discount</TableCell>
                      <TableCell>Tax</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {items.find(i => i.id === item.itemId)?.code}
                        </TableCell>
                        <TableCell>
                          {items
                            .find(i => i.id === item.itemId)
                            ?.variants.find(v => v.id === item.itemVariantId)?.code}
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                            inputProps={{ min: 1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(index, 'unitPrice', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.discountAmount}
                            onChange={(e) => handleUpdateItem(index, 'discountAmount', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.taxAmount}
                            onChange={(e) => handleUpdateItem(index, 'taxAmount', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleRemoveItem(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={items}
                getOptionLabel={(option) => option.code}
                onChange={(_, newValue) => {
                  if (newValue && newValue.variants.length > 0) {
                    handleAddItem(newValue, newValue.variants[0]);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Add Item"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT">Credit</option>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Payment Status"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewSaleDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateSale}
            variant="contained"
            disabled={!selectedCustomer || selectedItems.length === 0}
          >
            Create Sale
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Sale Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Sale Details</DialogTitle>
        <DialogContent>
          {selectedSale && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Transaction ID</Typography>
                <Typography>{selectedSale.id}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Date</Typography>
                <Typography>{selectedSale.date}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Customer</Typography>
                <Typography>{selectedSale.customerName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Status</Typography>
                <Typography>{selectedSale.status}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>Items</Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit Price</TableCell>
                        <TableCell>Discount</TableCell>
                        <TableCell>Tax</TableCell>
                        <TableCell>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedSale.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.itemId}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unitPrice}</TableCell>
                          <TableCell>{item.discountAmount}</TableCell>
                          <TableCell>{item.taxAmount}</TableCell>
                          <TableCell>
                            {(item.quantity * item.unitPrice) - item.discountAmount + item.taxAmount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Total Amount</Typography>
                <Typography>{selectedSale.totalAmount}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Tax Amount</Typography>
                <Typography>{selectedSale.taxAmount}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Discount Amount</Typography>
                <Typography>{selectedSale.discountAmount}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">Final Amount: {selectedSale.finalAmount}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Payment Method</Typography>
                <Typography>{selectedSale.paymentMethod}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Payment Status</Typography>
                <Typography>{selectedSale.paymentStatus}</Typography>
              </Grid>
              {selectedSale.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Notes</Typography>
                  <Typography>{selectedSale.notes}</Typography>
                </Grid>
              )}
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

export default Sales; 