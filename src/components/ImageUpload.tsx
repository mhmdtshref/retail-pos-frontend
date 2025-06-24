import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  IconButton,
  Card,
  CardMedia,
  CardActions,
  Alert,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuthenticatedAxios } from '../lib/axios';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  onImageRemove?: (imageUrl: string) => void;
  currentImageUrl?: string;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  onImageRemove,
  currentImageUrl,
  multiple = false,
  maxFiles = 1,
  label = 'Upload Image',
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    currentImageUrl ? [currentImageUrl] : []
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const axios = useAuthenticatedAxios();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      
      if (multiple) {
        // Multiple files
        const filesArray = Array.from(files);
        if (filesArray.length > maxFiles) {
          throw new Error(`Maximum ${maxFiles} files allowed`);
        }
        
        filesArray.forEach((file) => {
          formData.append('images', file);
        });

        const response = await axios.post('/upload/multiple', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const newImageUrls = response.data.data.imageUrls;
        setUploadedImages(prev => [...prev, ...newImageUrls]);
        
        // Call onImageUpload for each new image
        newImageUrls.forEach((url: string) => onImageUpload(url));
      } else {
        // Single file
        formData.append('image', files[0]);

        const response = await axios.post('/upload/single', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const imageUrl = response.data.data.imageUrl;
        setUploadedImages([imageUrl]);
        onImageUpload(imageUrl);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    setUploadedImages(prev => prev.filter(url => url !== imageUrl));
    if (onImageRemove) {
      onImageRemove(imageUrl);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Box>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        multiple={multiple}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Upload Button */}
      {(!multiple || uploadedImages.length < maxFiles) && (
        <Button
          variant="outlined"
          component="span"
          startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          onClick={handleClick}
          disabled={disabled || uploading}
          sx={{ mb: 2 }}
          fullWidth
        >
          {uploading ? 'Uploading...' : label}
        </Button>
      )}

      {/* Image Preview */}
      {uploadedImages.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {uploadedImages.map((imageUrl, index) => (
            <Card key={index} sx={{ width: 200, position: 'relative' }}>
              <CardMedia
                component="img"
                height="140"
                image={imageUrl}
                alt={`Uploaded image ${index + 1}`}
                sx={{ objectFit: 'cover' }}
              />
              <CardActions sx={{ justifyContent: 'center', p: 1 }}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveImage(imageUrl)}
                  disabled={disabled}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* Help Text */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Supported formats: JPG, PNG, GIF. Max file size: 5MB
        {multiple && ` • Max files: ${maxFiles}`}
      </Typography>
    </Box>
  );
};

export default ImageUpload; 