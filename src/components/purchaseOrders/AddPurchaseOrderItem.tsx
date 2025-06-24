import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useItemService } from '../../services/item.service';
import { PurchaseOrderItem } from '../../services/purchaseOrder.service';

interface AddPurchaseOrderItemProps {
  onAdd: (items: PurchaseOrderItem[]) => void;
  onCancel: () => void;
}

interface FormData {
  itemId: string;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  notes: string;
}

export const AddPurchaseOrderItem: React.FC<AddPurchaseOrderItemProps> = ({ onAdd, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [variantQuantities, setVariantQuantities] = useState<Record<string, number>>({});
  const [noVariantQuantity, setNoVariantQuantity] = useState(1);
  const { searchItems } = useItemService();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      itemId: '',
      unitPrice: 0,
      discountAmount: 0,
      taxAmount: 0,
      notes: '',
    },
  });

  const watchedItemId = watch('itemId');

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await searchItems({ limit: 100 });
        setItems(response.data.items);
      } catch (error) {
        console.error('Failed to fetch items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [searchItems]);

  useEffect(() => {
    if (watchedItemId) {
      const item = items.find(i => i.id === watchedItemId);
      setSelectedItem(item);
      if (item) {
        setValue('unitPrice', item.sellingPrice || 0);
        // Reset variant quantities
        if (item.variants && item.variants.length > 0) {
          const initialQuantities: Record<string, number> = {};
          item.variants.forEach((variant: any) => {
            initialQuantities[variant.id] = 1;
          });
          setVariantQuantities(initialQuantities);
        } else {
          setNoVariantQuantity(1);
        }
      }
    } else {
      setSelectedItem(null);
      setVariantQuantities({});
      setNoVariantQuantity(1);
    }
  }, [watchedItemId, items, setValue]);

  const handleVariantQuantityChange = (variantId: string, value: number) => {
    setVariantQuantities(prev => ({ ...prev, [variantId]: value }));
  };

  const onSubmit = (data: FormData) => {
    if (!selectedItem) return;
    const baseItem = {
      itemId: selectedItem.id,
      itemCode: selectedItem.code,
      itemDescription: selectedItem.description,
      unitPrice: Number(data.unitPrice),
      discountAmount: data.discountAmount ? Number(data.discountAmount) : undefined,
      taxAmount: data.taxAmount ? Number(data.taxAmount) : undefined,
      notes: data.notes || undefined,
    };
    let itemsToAdd: any[] = [];
    if (selectedItem.variants && selectedItem.variants.length > 0) {
      // Add all variants with quantity > 0
      selectedItem.variants.forEach((variant: any) => {
        const qty = variantQuantities[variant.id] || 0;
        if (qty > 0) {
          itemsToAdd.push({ ...baseItem, itemVariantId: variant.id, quantity: qty, variantCode: variant.code, variantAttributes: variant.attributes });
        }
      });
    } else {
      // No variants, add the item itself
      if (noVariantQuantity > 0) {
        itemsToAdd.push({ ...baseItem, quantity: noVariantQuantity });
      }
    }
    if (itemsToAdd.length > 0) {
      onAdd(itemsToAdd);
    }
    onCancel();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6">Add Item to Purchase Order</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.itemId}>
                <InputLabel>Item</InputLabel>
                <Controller
                  name="itemId"
                  control={control}
                  rules={{ required: 'Item is required' }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Item"
                      onChange={(e) => {
                        field.onChange(e);
                      }}
                    >
                      {items.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.code} - {item.description || 'No description'}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.itemId && (
                  <Typography color="error" variant="caption">
                    {errors.itemId.message?.toString()}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="unitPrice"
                control={control}
                rules={{ 
                  required: 'Unit price is required',
                  min: { value: 0, message: 'Unit price must be positive' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Unit Price"
                    type="number"
                    inputProps={{ step: "0.01", min: "0" }}
                    error={!!errors.unitPrice}
                    helperText={errors.unitPrice?.message?.toString()}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="discountAmount"
                control={control}
                rules={{ min: { value: 0, message: 'Discount must be positive' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Discount Amount"
                    type="number"
                    inputProps={{ step: "0.01", min: "0" }}
                    error={!!errors.discountAmount}
                    helperText={errors.discountAmount?.message?.toString()}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="taxAmount"
                control={control}
                rules={{ min: { value: 0, message: 'Tax must be positive' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Tax Amount"
                    type="number"
                    inputProps={{ step: "0.01", min: "0" }}
                    error={!!errors.taxAmount}
                    helperText={errors.taxAmount?.message?.toString()}
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
                    rows={2}
                  />
                )}
              />
            </Grid>
            {selectedItem && selectedItem.variants && selectedItem.variants.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Variants</Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Code</TableCell>
                        <TableCell>Attributes</TableCell>
                        <TableCell>Quantity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedItem.variants.map((variant: any) => (
                        <TableRow key={variant.id}>
                          <TableCell>{variant.code}</TableCell>
                          <TableCell>{Object.entries(variant.attributes || {}).map(([key, value]) => `${key}: ${value}`).join(', ')}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={variantQuantities[variant.id] || 0}
                              onChange={e => handleVariantQuantityChange(variant.id, Math.max(0, Number(e.target.value)))}
                              inputProps={{ min: 0 }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
            {selectedItem && (!selectedItem.variants || selectedItem.variants.length === 0) && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={noVariantQuantity}
                  onChange={e => setNoVariantQuantity(Math.max(1, Number(e.target.value)))}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={onCancel} variant="outlined">
                  Cancel
                </Button>
                <Button type="submit" variant="contained">
                  Add Item(s)
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
}; 