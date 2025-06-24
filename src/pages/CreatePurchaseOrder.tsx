import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { usePurchaseOrderService, PurchaseOrderItem } from '../services/purchaseOrder.service';
import { AddPurchaseOrderItem } from '../components/purchaseOrders/AddPurchaseOrderItem';

type PurchaseOrderItemWithMeta = PurchaseOrderItem & {
  itemCode?: string;
  itemDescription?: string;
  variantCode?: string;
  variantAttributes?: Record<string, any>;
};

interface FormData {
  expectedDeliveryDate: string;
  notes: string;
}

export const CreatePurchaseOrder: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [items, setItems] = useState<PurchaseOrderItemWithMeta[]>([]);
  const { createPurchaseOrder } = usePurchaseOrderService();

  const {
    control,
    handleSubmit,
  } = useForm<FormData>({
    defaultValues: {
      expectedDeliveryDate: '',
      notes: '',
    },
  });

  const handleAddItem = (newItems: PurchaseOrderItemWithMeta[]) => {
    setItems(prev => [...prev, ...newItems]);
    setShowAddItem(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateItemTotal = (item: PurchaseOrderItemWithMeta) => {
    const subtotal = item.quantity * item.unitPrice;
    const discount = item.discountAmount || 0;
    const tax = item.taxAmount || 0;
    return subtotal - discount + tax;
  };

  const calculateOrderTotals = () => {
    let totalAmount = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    items.forEach(item => {
      const subtotal = item.quantity * item.unitPrice;
      const discount = item.discountAmount || 0;
      const tax = item.taxAmount || 0;

      totalAmount += subtotal;
      totalTax += tax;
      totalDiscount += discount;
    });

    const finalAmount = totalAmount - totalDiscount + totalTax;

    return {
      totalAmount,
      totalTax,
      totalDiscount,
      finalAmount,
    };
  };

  const onSubmit = async (data: FormData) => {
    if (items.length === 0) {
      alert('Please add at least one item to the purchase order');
      return;
    }

    try {
      setLoading(true);
      const requestData = {
        expectedDeliveryDate: data.expectedDeliveryDate || undefined,
        notes: data.notes || undefined,
        items,
      };

      const response = await createPurchaseOrder(requestData);
      console.log('Purchase order created:', response.data.purchaseOrder);
      
      // Navigate back to purchase orders list
      navigate('/purchase-orders');
    } catch (error) {
      console.error('Failed to create purchase order:', error);
      alert('Failed to create purchase order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateOrderTotals();

  // Group items by itemId
  const groupedItems = items.reduce<Record<string, PurchaseOrderItemWithMeta[]>>((acc, item) => {
    if (!acc[item.itemId]) acc[item.itemId] = [];
    acc[item.itemId].push(item);
    return acc;
  }, {});

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create Purchase Order
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/purchase-orders')}
        >
          Back to Purchase Orders
        </Button>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Order number will be automatically generated in format: PO-YY-XXXX (e.g., PO-24-0001)
      </Typography>

      <Grid container spacing={3}>
        {/* Purchase Order Details */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Purchase Order Details
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="expectedDeliveryDate"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Expected Delivery Date"
                          type="date"
                          InputLabelProps={{ shrink: true }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="notes"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Notes"
                          multiline
                          rows={4}
                          placeholder="Additional notes for the purchase order..."
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={loading || items.length === 0}
                      startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                      {loading ? 'Creating...' : 'Create Purchase Order'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Items Section */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Purchase Order Items ({items.length})
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddItem(true)}
                  variant="outlined"
                >
                  Add Item
                </Button>
              </Box>

              {items.length === 0 ? (
                <Alert severity="info">
                  No items added yet. Click "Add Item" to start building your purchase order.
                </Alert>
              ) : (
                <>
                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Variant</TableCell>
                          <TableCell>Attributes</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Discount</TableCell>
                          <TableCell align="right">Tax</TableCell>
                          <TableCell align="right">Total</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.values(groupedItems).map((group, groupIdx) => (
                          <React.Fragment key={group[0].itemId}>
                            {/* Item header row */}
                            <TableRow sx={{ backgroundColor: 'grey.100' }}>
                              <TableCell colSpan={10}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {group[0].itemCode} - {group[0].itemDescription || 'No description'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                            {/* Variant rows */}
                            {group.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell />
                                <TableCell />
                                <TableCell>
                                  {item.variantCode ? (
                                    <Chip label={item.variantCode} size="small" />
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      No variant
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {item.variantAttributes
                                    ? Object.entries(item.variantAttributes).map(([key, value]) => `${key}: ${value}`).join(', ')
                                    : ''}
                                </TableCell>
                                <TableCell align="right">{item.quantity}</TableCell>
                                <TableCell align="right">${Number(item.unitPrice).toFixed(2)}</TableCell>
                                <TableCell align="right">${Number(item.discountAmount || 0).toFixed(2)}</TableCell>
                                <TableCell align="right">${Number(item.taxAmount || 0).toFixed(2)}</TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight="bold">
                                    ${calculateItemTotal(item).toFixed(2)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveItem(items.indexOf(item))}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Order Summary */}
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      Order Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2">
                          Subtotal: ${totals.totalAmount.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2">
                          Discount: ${totals.totalDiscount.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2">
                          Tax: ${totals.totalTax.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="h6" fontWeight="bold">
                          Final Total: ${totals.finalAmount.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Item Modal */}
      {showAddItem && (
        <Box sx={{ mt: 3 }}>
          <AddPurchaseOrderItem
            onAdd={handleAddItem}
            onCancel={() => setShowAddItem(false)}
          />
        </Box>
      )}
    </Box>
  );
}; 