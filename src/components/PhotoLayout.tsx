import React from 'react';
import { Box } from '@mui/material';
import { PhotoLayoutProps } from '../types';

const FRAME_IMAGE = '/.PhotoBooth/frame_summer_640x480.png';

const PhotoLayout: React.FC<PhotoLayoutProps> = ({ layout, images }) => {
  // Đơn giản: render các ảnh với overlay khung
  return (
    <Box className="photo-layout-export" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {images.map((img, idx) => (
        <Box key={idx} sx={{ position: 'relative', width: 320, height: 240, margin: 1 }}>
          <img
            src={img}
            alt={`pose-${idx + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
          />
          <img
            src={FRAME_IMAGE}
            alt="frame"
            style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          />
        </Box>
      ))}
    </Box>
  );
};

export default PhotoLayout; 