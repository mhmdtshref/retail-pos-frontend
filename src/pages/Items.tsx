import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, CircularProgress, Alert, Container } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { useItemService, Item } from '../services/item.service';
import { AddItem } from '../components/items/AddItem';

const columns: GridColDef[] = [
  { field: 'code', headerName: 'Code', flex: 1 },
  { field: 'description', headerName: 'Description', flex: 1 },
  { field: 'store', headerName: 'Store', flex: 1 },
  {
    field: 'category',
    headerName: 'Category',
    flex: 1,
    valueGetter: (params) => params.row.category?.name || '-',
  },
  {
    field: 'sellingPrice',
    headerName: 'Price',
    flex: 1,
    valueGetter: (params) => params.row.sellingPrice ? `$${params.row.sellingPrice}` : '-',
  },
  {
    field: 'variants',
    headerName: 'Variants',
    flex: 1,
    valueGetter: (params) => params.row.variants?.length || 0,
  },
];

const Items: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  const { searchItems } = useItemService();

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await searchItems({
        query: searchQuery,
        limit: pagination.pageSize,
        offset: pagination.page * pagination.pageSize,
      });
      setItems(response.data.items);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [searchQuery, pagination.page, pagination.pageSize]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page on new search
  };

  const handleAddItemSuccess = () => {
    setShowAddItem(false);
    fetchItems(); // Refresh the items list
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">Items</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddItem(true)}
          >
            Add Item
          </Button>
        </Box>

        {showAddItem ? (
          <AddItem
            onSuccess={handleAddItemSuccess}
            onCancel={() => setShowAddItem(false)}
          />
        ) : (
          <Box>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search items..."
                value={searchQuery}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                  rows={items}
                  columns={columns}
                  initialState={{
                    pagination: {
                      paginationModel: {
                        pageSize: pagination.pageSize,
                        page: pagination.page,
                      },
                    },
                  }}
                  rowCount={pagination.total}
                  paginationMode="server"
                  onPaginationModelChange={(model: GridPaginationModel) => {
                    setPagination(prev => ({
                      ...prev,
                      page: model.page,
                      pageSize: model.pageSize,
                    }));
                  }}
                  pageSizeOptions={[10, 25, 50]}
                  disableRowSelectionOnClick
                />
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Items;
