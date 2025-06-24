import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  TextField,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Autocomplete,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Clear as ClearIcon, Image as ImageIcon } from '@mui/icons-material';
import { useItemApi, useSaleApi, Item, SaleItem, CreateSaleRequest, ItemVariant } from '../services/api';
import { useCustomerService, Customer } from '../services/customer.service';

interface CartItem extends SaleItem {
  code: string;
  variantCode?: string;
  imageUrl?: string;
}

const POS: React.FC = () => {
  console.log('POS component rendering');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [selectedItemForVariant, setSelectedItemForVariant] = useState<Item | null>(null);

  // Customer state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const customerSearchTimeoutRef = useRef<NodeJS.Timeout>();

  const itemApi = useItemApi();
  const saleApi = useSaleApi();
  const customerService = useCustomerService();

  const handleSearch = useCallback(async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      console.log('Searching for:', query);
      const response = await itemApi.search({ query });
      console.log('Search results:', response);
      setSearchResults(response.data.items);
    } catch (error) {
      console.error('Error searching items:', error);
      setError('Failed to search items. Please try again.');
    }
  }, [itemApi]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  }, [handleSearch]);

  const handleItemSelect = (item: Item) => {
    if (item.variants && item.variants.length > 0) {
      setSelectedItemForVariant(item);
      setIsVariantDialogOpen(true);
    } else {
      addItemToCart(item);
    }
  };

  const addItemToCart = (item: Item, variant?: ItemVariant) => {
    const newItem: CartItem = {
      itemId: item.id,
      itemVariantId: variant?.id,
      quantity: 1,
      unitPrice: variant?.sellingPrice || item.sellingPrice,
      code: item.code,
      variantCode: variant?.code,
      imageUrl: variant?.imageUrl || item.imageUrl,
    };
    setCartItems([...cartItems, newItem]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleVariantSelect = (variant: ItemVariant) => {
    if (selectedItemForVariant) {
      addItemToCart(selectedItemForVariant, variant);
      setIsVariantDialogOpen(false);
      setSelectedItemForVariant(null);
    }
  };

  const handleEditItem = (item: CartItem) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDeleteItem = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const handleSaveEdit = () => {
    if (selectedItem) {
      setCartItems(
        cartItems.map((item) =>
          item.itemId === selectedItem.itemId ? selectedItem : item
        )
      );
    }
    setIsEditDialogOpen(false);
    setSelectedItem(null);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (discountType === 'percentage') {
      return (subtotal * discountValue) / 100;
    }
    return discountValue;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const handleCustomerSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setCustomerSuggestions([]);
      return;
    }

    try {
      const response = await customerService.searchCustomers({ query, limit: 10 });
      setCustomerSuggestions(response.data.customers);
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  }, [customerService]);

  const handleCustomerNameChange = (value: string) => {
    setCustomerName(value);
    setSelectedCustomer(null);
    
    if (customerSearchTimeoutRef.current) {
      clearTimeout(customerSearchTimeoutRef.current);
    }

    customerSearchTimeoutRef.current = setTimeout(() => {
      handleCustomerSearch(value);
    }, 300);
  };

  const handleCustomerPhoneChange = (value: string) => {
    setCustomerPhone(value);
    setSelectedCustomer(null);
    
    if (customerSearchTimeoutRef.current) {
      clearTimeout(customerSearchTimeoutRef.current);
    }

    customerSearchTimeoutRef.current = setTimeout(() => {
      handleCustomerSearch(value);
    }, 300);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone || '');
    setCustomerSuggestions([]);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerSuggestions([]);
  };

  const handleCreateSale = async () => {
    try {
      const saleData: CreateSaleRequest = {
        items: cartItems.map(({ itemId, itemVariantId, quantity, unitPrice, discountAmount, notes }) => ({
          itemId,
          itemVariantId,
          quantity,
          unitPrice,
          discountAmount,
          notes,
        })),
        paymentMethod: 'CASH' as const,
        paymentStatus: 'PAID' as const,
        // Add customer data if provided
        ...(customerName && customerPhone && {
          customer: {
            name: customerName,
            phone: customerPhone,
          }
        }),
      };
      await saleApi.create(saleData);
      setCartItems([]);
      setDiscountValue(0);
      handleClearCustomer();
    } catch (error) {
      console.error('Error creating sale:', error);
      setError('Failed to create sale. Please try again.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Typography variant="h4" gutterBottom>
        Point of Sale
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Customer Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  freeSolo
                  options={customerSuggestions}
                  getOptionLabel={(option) => 
                    typeof option === 'string' ? option : option.name
                  }
                  inputValue={customerName}
                  onInputChange={(_, newValue) => handleCustomerNameChange(newValue)}
                  onChange={(_, newValue) => {
                    if (typeof newValue === 'object' && newValue) {
                      handleCustomerSelect(newValue);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Customer Name"
                      fullWidth
                      placeholder="Search by name..."
                    />
                  )}
                  renderOption={(props, option) => (
                    <ListItem {...props}>
                      <ListItemText
                        primary={option.name}
                        secondary={option.phone ? `Phone: ${option.phone}` : 'No phone'}
                      />
                    </ListItem>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  freeSolo
                  options={customerSuggestions}
                  getOptionLabel={(option) => 
                    typeof option === 'string' ? option : option.phone || ''
                  }
                  inputValue={customerPhone}
                  onInputChange={(_, newValue) => handleCustomerPhoneChange(newValue)}
                  onChange={(_, newValue) => {
                    if (typeof newValue === 'object' && newValue) {
                      handleCustomerSelect(newValue);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Mobile Number"
                      fullWidth
                      placeholder="Search by phone..."
                    />
                  )}
                  renderOption={(props, option) => (
                    <ListItem {...props}>
                      <ListItemText
                        primary={option.name}
                        secondary={option.phone ? `Phone: ${option.phone}` : 'No phone'}
                      />
                    </ListItem>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClearCustomer}
                  disabled={!customerName && !customerPhone}
                >
                  Clear Customer
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Search Items"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              sx={{ mb: 2 }}
            />
            {searchResults.length > 0 && (
              <List>
                {searchResults.map((item) => (
                  <ListItem
                    key={item.id}
                    button
                    onClick={() => handleItemSelect(item)}
                  >
                    <ListItemAvatar>
                      {item.imageUrl ? (
                        <Avatar
                          src={item.imageUrl}
                          alt={item.code}
                          sx={{ width: 56, height: 56 }}
                        />
                      ) : (
                        <Avatar sx={{ width: 56, height: 56 }}>
                          <ImageIcon />
                        </Avatar>
                      )}
                    </ListItemAvatar>
                    <ListItemText
                      primary={item.code}
                      secondary={`${item.description} - $${item.sellingPrice}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Cart Items
            </Typography>
            <List>
              {cartItems.map((item, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <Box>
                      <IconButton onClick={() => handleEditItem(item)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteItem(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    {item.imageUrl ? (
                      <Avatar
                        src={item.imageUrl}
                        alt={item.code}
                        sx={{ width: 48, height: 48 }}
                      />
                    ) : (
                      <Avatar sx={{ width: 48, height: 48 }}>
                        <ImageIcon />
                      </Avatar>
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {item.code}
                        {item.variantCode && (
                          <Chip
                            size="small"
                            label={item.variantCode}
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={`${item.quantity} x $${item.unitPrice} = $${
                      item.quantity * item.unitPrice
                    }`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            {selectedCustomer && (
              <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="primary">
                  Customer: {selectedCustomer.name}
                </Typography>
                {selectedCustomer.phone && (
                  <Typography variant="body2" color="text.secondary">
                    Phone: {selectedCustomer.phone}
                  </Typography>
                )}
              </Box>
            )}
            <Box sx={{ mb: 2 }}>
              <Typography>Subtotal: ${calculateSubtotal().toFixed(2)}</Typography>
              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth sx={{ mb: 1 }}>
                  <InputLabel>Discount Type</InputLabel>
                  <Select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                    label="Discount Type"
                  >
                    <MenuItem value="percentage">Percentage</MenuItem>
                    <MenuItem value="fixed">Fixed Amount</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  type="number"
                  label="Discount Value"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  InputProps={{
                    startAdornment: discountType === 'percentage' ? '%' : '$',
                  }}
                />
              </Box>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Total: ${calculateTotal().toFixed(2)}
              </Typography>
            </Box>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleCreateSale}
              disabled={cartItems.length === 0}
            >
              Complete Sale
            </Button>
          </Paper>
        </Grid>

        {/* Variant Selection Dialog */}
        <Dialog
          open={isVariantDialogOpen}
          onClose={() => {
            setIsVariantDialogOpen(false);
            setSelectedItemForVariant(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Select Variant</DialogTitle>
          <DialogContent>
            {selectedItemForVariant && (
              <List>
                {selectedItemForVariant.variants?.map((variant) => (
                  <ListItem
                    key={variant.id}
                    button
                    onClick={() => handleVariantSelect(variant)}
                  >
                    <ListItemAvatar>
                      {variant.imageUrl ? (
                        <Avatar
                          src={variant.imageUrl}
                          alt={variant.code}
                          sx={{ width: 56, height: 56 }}
                        />
                      ) : (
                        <Avatar sx={{ width: 56, height: 56 }}>
                          <ImageIcon />
                        </Avatar>
                      )}
                    </ListItemAvatar>
                    <ListItemText
                      primary={variant.code}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Price: ${variant.sellingPrice}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Stock: {variant.stockQuantity}
                          </Typography>
                          {Object.entries(variant.attributes).map(([key, value]) => (
                            <Typography key={key} variant="body2" color="text.secondary">
                              {key}: {value}
                            </Typography>
                          ))}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setIsVariantDialogOpen(false);
                setSelectedItemForVariant(null);
              }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogContent>
            {selectedItem && (
              <Box sx={{ pt: 2 }}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={selectedItem.quantity}
                  onChange={(e) =>
                    setSelectedItem({
                      ...selectedItem,
                      quantity: Number(e.target.value),
                    })
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Unit Price"
                  type="number"
                  value={selectedItem.unitPrice}
                  onChange={(e) =>
                    setSelectedItem({
                      ...selectedItem,
                      unitPrice: Number(e.target.value),
                    })
                  }
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
    </Box>
  );
};

export default POS; 