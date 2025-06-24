import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePurchaseOrderService, PurchaseOrder } from '../services/purchaseOrder.service';

const statusColors = {
  DRAFT: 'default',
  ORDERED: 'warning',
  RECEIVED: 'success',
  CANCELLED: 'error',
} as const;

const statusLabels = {
  DRAFT: 'Draft',
  ORDERED: 'Ordered',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled',
} as const;

export const PurchaseOrders: React.FC = () => {
  const navigate = useNavigate();
  const { getPurchaseOrders, getPurchaseOrderById, updatePurchaseOrderStatus } = usePurchaseOrderService();
  
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [orderToUpdate, setOrderToUpdate] = useState<PurchaseOrder | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrderForMenu, setSelectedOrderForMenu] = useState<PurchaseOrder | null>(null);

  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getPurchaseOrders({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        limit: 50,
      });
      setPurchaseOrders(response.data.purchaseOrders);
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
    } finally {
      setLoading(false);
    }
  }, [getPurchaseOrders, searchTerm, statusFilter]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  const handleSearch = () => {
    // This is now handled automatically by the useEffect
  };

  const handleViewOrder = async (orderId: string) => {
    try {
      const response = await getPurchaseOrderById(orderId);
      setSelectedOrder(response.data.purchaseOrder);
      setViewDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch purchase order details:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateTotalItems = (order: PurchaseOrder) => {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  };

  const handleStatusUpdate = async () => {
    if (!orderToUpdate || !newStatus) return;

    try {
      setStatusUpdateLoading(true);
      await updatePurchaseOrderStatus(orderToUpdate.id, newStatus);
      
      // Refresh the purchase orders list
      await fetchPurchaseOrders();
      
      // Close dialogs
      setStatusUpdateDialogOpen(false);
      setOrderToUpdate(null);
      setNewStatus('');
      
      // Show success message (you can add a toast notification here)
      console.log('Status updated successfully');
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const openStatusUpdateDialog = (order: PurchaseOrder, status: string) => {
    setOrderToUpdate(order);
    setNewStatus(status);
    setStatusUpdateDialogOpen(true);
    setAnchorEl(null);
  };

  const getAvailableStatuses = (currentStatus: string) => {
    switch (currentStatus) {
      case 'DRAFT':
        return ['ORDERED', 'CANCELLED'];
      case 'ORDERED':
        return ['RECEIVED', 'CANCELLED'];
      case 'RECEIVED':
        return ['CANCELLED'];
      case 'CANCELLED':
        return [];
      default:
        return [];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ORDERED':
        return <LocalShippingIcon />;
      case 'RECEIVED':
        return <CheckCircleIcon />;
      case 'CANCELLED':
        return <CancelIcon />;
      default:
        return <EditIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Purchase Orders</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/purchase-orders/create')}
        >
          Create Purchase Order
        </Button>
      </Box>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search by order number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={handleSearch}>
                      <SearchIcon />
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="ORDERED">Ordered</MenuItem>
                  <MenuItem value="RECEIVED">Received</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={handleSearch}
                fullWidth
              >
                Apply Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      {purchaseOrders.length === 0 ? (
        <Alert severity="info">
          No purchase orders found. Create your first purchase order to get started.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order Number</TableCell>
                <TableCell>Order Date</TableCell>
                <TableCell>Expected Delivery</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Items</TableCell>
                <TableCell align="right">Total Amount</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseOrders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {order.orderNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(order.orderDate)}</TableCell>
                  <TableCell>
                    {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : 'Not set'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabels[order.status as keyof typeof statusLabels] || order.status}
                      color={statusColors[order.status as keyof typeof statusColors] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">{calculateTotalItems(order)}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      ${Number(order.finalAmount).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewOrder(order.id)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Update Status">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setSelectedOrderForMenu(order);
                            setAnchorEl(e.currentTarget);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Status Update Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {selectedOrderForMenu && getAvailableStatuses(selectedOrderForMenu.status).map((status) => (
          <MenuItem
            key={status}
            onClick={() => openStatusUpdateDialog(selectedOrderForMenu, status)}
          >
            <ListItemIcon>
              {getStatusIcon(status)}
            </ListItemIcon>
            <ListItemText primary={`Mark as ${statusLabels[status as keyof typeof statusLabels]}`} />
          </MenuItem>
        ))}
        {selectedOrderForMenu && getAvailableStatuses(selectedOrderForMenu.status).length === 0 && (
          <MenuItem disabled>
            <ListItemText primary="No status changes available" />
          </MenuItem>
        )}
      </Menu>

      {/* Status Update Confirmation Dialog */}
      <Dialog
        open={statusUpdateDialogOpen}
        onClose={() => setStatusUpdateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Update Purchase Order Status
        </DialogTitle>
        <DialogContent>
          {orderToUpdate && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to update the status of purchase order{' '}
                <strong>{orderToUpdate.orderNumber}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Status: <Chip label={statusLabels[orderToUpdate.status as keyof typeof statusLabels] || orderToUpdate.status} color={statusColors[orderToUpdate.status as keyof typeof statusColors] || 'default'} size="small" />
              </Typography>
              <Typography variant="body2" color="text.secondary">
                New Status: <Chip label={statusLabels[newStatus as keyof typeof statusLabels] || newStatus} color={statusColors[newStatus as keyof typeof statusColors] || 'default'} size="small" />
              </Typography>
              {newStatus === 'RECEIVED' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Note:</strong> When marking as received, the system will automatically:
                  </Typography>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    <li>Update inventory stock levels</li>
                    <li>Update purchase prices</li>
                    <li>Create movement records</li>
                    <li>Set the delivery date</li>
                  </ul>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setStatusUpdateDialogOpen(false)}
            disabled={statusUpdateLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={statusUpdateLoading}
            startIcon={statusUpdateLoading ? <CircularProgress size={20} /> : null}
          >
            {statusUpdateLoading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Purchase Order: {selectedOrder.orderNumber}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    label={statusLabels[selectedOrder.status as keyof typeof statusLabels] || selectedOrder.status}
                    color={statusColors[selectedOrder.status as keyof typeof statusColors] || 'default'}
                  />
                  {getAvailableStatuses(selectedOrder.status).length > 0 && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setOrderToUpdate(selectedOrder);
                        setNewStatus(getAvailableStatuses(selectedOrder.status)[0]);
                        setStatusUpdateDialogOpen(true);
                        setViewDialogOpen(false);
                      }}
                    >
                      Update Status
                    </Button>
                  )}
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Order Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedOrder.orderDate)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={statusLabels[selectedOrder.status as keyof typeof statusLabels] || selectedOrder.status}
                    color={statusColors[selectedOrder.status as keyof typeof statusColors] || 'default'}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Expected Delivery
                  </Typography>
                  <Typography variant="body1">
                    {selectedOrder.expectedDeliveryDate ? formatDate(selectedOrder.expectedDeliveryDate) : 'Not set'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    ${Number(selectedOrder.finalAmount).toFixed(2)}
                  </Typography>
                </Grid>
                {selectedOrder.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body1">
                      {selectedOrder.notes}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Items ({selectedOrder.items.length})
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell>Variant</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {item.item?.code || item.itemId}
                              </Typography>
                              {item.notes && (
                                <Typography variant="caption" color="text.secondary">
                                  {item.notes}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.itemVariant ? (
                                <Chip
                                  label={`${item.itemVariant.code} - ${Object.entries(item.itemVariant.attributes || {}).map(([key, value]) => `${key}: ${value}`).join(', ')}`}
                                  size="small"
                                />
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No variant
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">${Number(item.unitPrice).toFixed(2)}</TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold">
                                ${Number(item.total).toFixed(2)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}; 