import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  TextField,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useItemService, CreateItemRequest, Category, Store } from '../../services/item.service';
import ImageUpload from '../ImageUpload';

interface AddItemProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

type FormData = CreateItemRequest;

interface VariantGroup {
  name: string;
  values: string[];
}

export const AddItem: React.FC<AddItemProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [itemImageUrl, setItemImageUrl] = useState<string>('');
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([]);
  const [previewVariants, setPreviewVariants] = useState<string[]>([]);
  const { createItemWithVariants, getCategories } = useItemService();
  
  // Store the service functions in refs to prevent re-renders
  const getCategoriesRef = useRef(getCategories);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      store: Store.LARICHE, // Default to Lariche
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const categoriesData = await getCategoriesRef.current();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Generate preview variants when variant groups change
  useEffect(() => {
    if (variantGroups.length === 0) {
      setPreviewVariants([]);
      return;
    }

    const generateCombinations = (groups: VariantGroup[]): string[] => {
      if (groups.length === 0) return [];
      if (groups.length === 1) return groups[0].values;
      
      const [firstGroup, ...remainingGroups] = groups;
      const remainingCombinations = generateCombinations(remainingGroups);
      
      return firstGroup.values.flatMap(value => 
        remainingCombinations.length > 0 
          ? remainingCombinations.map(combo => `${value}/${combo}`)
          : [value]
      );
    };

    const combinations = generateCombinations(variantGroups);
    setPreviewVariants(combinations);
  }, [variantGroups]);

  const addVariantGroup = () => {
    setVariantGroups([...variantGroups, { name: '', values: [] }]);
  };

  const removeVariantGroup = (index: number) => {
    setVariantGroups(variantGroups.filter((_, i) => i !== index));
  };

  const updateVariantGroup = (index: number, field: 'name' | 'values', value: string | string[]) => {
    const updatedGroups = [...variantGroups];
    updatedGroups[index] = { ...updatedGroups[index], [field]: value };
    setVariantGroups(updatedGroups);
  };

  const addValueToGroup = (groupIndex: number, value: string) => {
    if (!value.trim()) return;
    const updatedGroups = [...variantGroups];
    if (!updatedGroups[groupIndex].values.includes(value.trim())) {
      updatedGroups[groupIndex].values.push(value.trim());
      setVariantGroups(updatedGroups);
    }
  };

  const removeValueFromGroup = (groupIndex: number, valueIndex: number) => {
    const updatedGroups = [...variantGroups];
    updatedGroups[groupIndex].values.splice(valueIndex, 1);
    setVariantGroups(updatedGroups);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      // Convert variant groups to the expected format
      const variantGroupsObj: Record<string, string[]> = {};
      variantGroups.forEach(group => {
        if (group.name && group.values.length > 0) {
          variantGroupsObj[group.name] = group.values;
        }
      });

      const requestData = {
        ...data,
        imageUrl: itemImageUrl,
        variantGroups: Object.keys(variantGroupsObj).length > 0 ? variantGroupsObj : undefined,
      };

      await createItemWithVariants(requestData);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemImageUpload = (imageUrl: string) => {
    setItemImageUrl(imageUrl);
  };

  const handleItemImageRemove = () => {
    setItemImageUrl('');
  };

  if (loadingData) {
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
              <Typography variant="h6">Add New Item</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Code will be automatically generated in format: SSS-YY-XXXX (e.g., MQN-24-0001 for Mini Queen, LCH-24-0001 for Lariche)
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.categoryId}>
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  {...register('categoryId', { required: 'Category is required' })}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.categoryId && (
                  <Typography color="error" variant="caption">
                    {errors.categoryId.message?.toString()}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.store}>
                <InputLabel>Store</InputLabel>
                <Select
                  label="Store"
                  {...register('store', { required: 'Store is required' })}
                >
                  <MenuItem value={Store.LARICHE}>Lariche (Women)</MenuItem>
                  <MenuItem value={Store.MINI_QUEEN}>Mini Queen (Kids)</MenuItem>
                </Select>
                {errors.store && (
                  <Typography color="error" variant="caption">
                    {errors.store.message?.toString()}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                {...register('description')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Purchase Price"
                type="number"
                inputProps={{ step: "0.01", min: "0" }}
                {...register('purchasePrice', { 
                  valueAsNumber: true,
                  min: { value: 0, message: 'Purchase price must be positive' }
                })}
                error={!!errors.purchasePrice}
                helperText={errors.purchasePrice?.message?.toString()}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Selling Price"
                type="number"
                inputProps={{ step: "0.01", min: "0" }}
                {...register('sellingPrice', { 
                  valueAsNumber: true,
                  min: { value: 0, message: 'Selling price must be positive' }
                })}
                error={!!errors.sellingPrice}
                helperText={errors.sellingPrice?.message?.toString()}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                {...register('notes')}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Item Image</Typography>
              <ImageUpload
                onImageUpload={handleItemImageUpload}
                onImageRemove={handleItemImageRemove}
                currentImageUrl={itemImageUrl}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                Variant Groups (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Define variant groups to automatically generate all combinations. 
                For example: Color: Red, Blue and Size: M, L, XL will create: Red/M, Red/L, Red/XL, Blue/M, Blue/L, Blue/XL
              </Typography>

              {variantGroups.map((group, groupIndex) => (
                <Box key={groupIndex} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Group Name (e.g., Color, Size)"
                        value={group.name}
                        onChange={(e) => updateVariantGroup(groupIndex, 'name', e.target.value)}
                        placeholder="e.g., Color"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Add Value"
                        placeholder="e.g., Red"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addValueToGroup(groupIndex, (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <IconButton 
                        onClick={() => removeVariantGroup(groupIndex)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {group.values.map((value, valueIndex) => (
                          <Chip
                            key={valueIndex}
                            label={value}
                            onDelete={() => removeValueFromGroup(groupIndex, valueIndex)}
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              ))}

              <Button
                startIcon={<AddIcon />}
                onClick={addVariantGroup}
                variant="outlined"
                sx={{ mb: 2 }}
              >
                Add Variant Group
              </Button>

              {previewVariants.length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Preview: {previewVariants.length} variants will be created:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {previewVariants.slice(0, 10).map((variant, index) => (
                      <Chip key={index} label={variant} size="small" />
                    ))}
                    {previewVariants.length > 10 && (
                      <Chip label={`+${previewVariants.length - 10} more`} size="small" />
                    )}
                  </Box>
                </Alert>
              )}
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={onCancel} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Creating...' : 'Create Item'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
}; 