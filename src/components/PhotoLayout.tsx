import React from 'react';
import { Box, Paper } from '@mui/material';
import { PhotoLayoutProps } from '../types';

const FRAME_BG_COLOR = '#6d4c41'; // Brown background
const STICKER_IMAGE = '/.PhotoBooth/frame_summer.png'; // Optional: sticker border PNG

const PhotoLayout: React.FC<PhotoLayoutProps> = ({ images }) => {
  const CONTAINER_WIDTH = 480;
  const CONTAINER_HEIGHT = 750;
  const PHOTO_WIDTH = 240;
  const PHOTO_HEIGHT = 320;
  const PHOTO_SPACING = 40;

  return (
    <Paper
      elevation={6}
      sx={{
        width: { xs: '100%', sm: `${CONTAINER_WIDTH}px` },
        height: { xs: 'auto', sm: `${CONTAINER_HEIGHT}px` },
        maxWidth: `${CONTAINER_WIDTH}px`,
        maxHeight: `${CONTAINER_HEIGHT}px`,
        background: FRAME_BG_COLOR,
        borderRadius: 6,
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        m: '0 auto',
        p: { xs: 2, sm: 4 },
      }}
    >
      {/* Optional: Summer sticker border overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <img
          src={STICKER_IMAGE}
          alt="summer sticker frame"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </Box>
      {/* Photo frames */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 3,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pt: { xs: 4, sm: 8 },
          pb: { xs: 2, sm: 4 },
        }}
      >
        {images.slice(0, 2).map((img, idx) => (
          <Box
            key={idx}
            sx={{
              width: `${PHOTO_WIDTH}px`,
              height: `${PHOTO_HEIGHT}px`,
              background: '#fff',
              borderRadius: 8,
              overflow: 'hidden',
              mb: idx === 0 ? `${PHOTO_SPACING}px` : 0,
              boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={img}
              alt={`pose-${idx + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default PhotoLayout; 