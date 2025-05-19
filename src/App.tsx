import React, { useState, useRef, useEffect } from 'react';
import { Box, Container, Button, Grid, Typography, Paper } from '@mui/material';
import Webcam from 'react-webcam';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import PhotoLayout from './components/PhotoLayout';
import CountdownTimer from './components/CountdownTimer';
import { LayoutType } from './types';

const App: React.FC = () => {
  const [layout, setLayout] = useState<LayoutType>('4pose');
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [remainingPhotos, setRemainingPhotos] = useState(0);
  const webcamRef = useRef<Webcam>(null);
  const photoContainerRef = useRef<HTMLDivElement>(null);

  const getLayoutPhotoCount = (layoutType: LayoutType): number => {
    switch (layoutType) {
      case '2pose': return 2;
      case '3pose': return 3;
      case '4pose': return 4;
      case '6pose': return 6;
      default: return 4;
    }
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImages(prev => [...prev, imageSrc]);
        setRemainingPhotos(prev => prev - 1);
      }
    }
  };

  const startCapture = () => {
    setCapturedImages([]);
    const photoCount = getLayoutPhotoCount(layout);
    setRemainingPhotos(photoCount);
    setShowCountdown(true);
    setIsCapturing(true);
  };

  const handleCountdownComplete = () => {
    capturePhoto();
    setShowCountdown(false);
    
    // Nếu còn ảnh cần chụp, bắt đầu đếm ngược cho ảnh tiếp theo
    if (remainingPhotos > 1) {
      setTimeout(() => {
        setShowCountdown(true);
      }, 1000);
    } else {
      setIsCapturing(false);
    }
  };

  const savePhoto = async () => {
    const layoutPhotoCount: Record<LayoutType, number> = { '2pose': 2, '3pose': 3, '4pose': 4, '6pose': 6 };
    const photoCount = layoutPhotoCount[layout];
    if (capturedImages.length < photoCount) {
      alert(`Bạn cần chụp đủ ${photoCount} ảnh để xuất layout này!`);
      return;
    }
    const frameImg = new window.Image();
    frameImg.src = '/frame_summer_640X480.png';
    await new Promise((res) => { frameImg.onload = res; });

    const SCALE = 2; // xuất ảnh x2 để nét hơn
    const MARGIN = 20 * SCALE;
    const PADDING = 40 * SCALE;
    let imgW = 640 * SCALE, imgH = 480 * SCALE;
    let width = imgW;
    let height = imgH * photoCount + MARGIN * (photoCount - 1) + 60 * SCALE;
    let isGrid = false;
    let gridCols = 1, gridRows = photoCount;
    if (layout === '6pose') {
      isGrid = true;
      imgW = 320 * SCALE; imgH = 240 * SCALE;
      gridCols = 3; gridRows = 2;
      width = imgW * gridCols + MARGIN * (gridCols - 1);
      height = imgH * gridRows + MARGIN * (gridRows - 1) + 60 * SCALE;
    }
    width += PADDING * 2;
    height += PADDING * 2;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    // Hàm vẽ object-fit: cover
    function drawImageCover(
      ctx: CanvasRenderingContext2D,
      img: HTMLImageElement,
      dx: number,
      dy: number,
      dWidth: number,
      dHeight: number
    ) {
      const arImg = img.width / img.height;
      const arBox = dWidth / dHeight;
      let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
      if (arImg > arBox) {
        // Ảnh rộng hơn, crop ngang
        sWidth = img.height * arBox;
        sx = (img.width - sWidth) / 2;
      } else {
        // Ảnh cao hơn, crop dọc
        sHeight = img.width / arBox;
        sy = (img.height - sHeight) / 2;
      }
      ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    }

    if (isGrid) {
      for (let i = 0; i < 6; i++) {
        const img = new window.Image();
        img.src = capturedImages[i];
        // eslint-disable-next-line no-await-in-loop
        await new Promise((res) => { img.onload = res; });
        const col = i % gridCols;
        const row = Math.floor(i / gridCols);
        const x = PADDING + col * (imgW + MARGIN);
        const y = PADDING + row * (imgH + MARGIN);
        drawImageCover(ctx, img, x, y, imgW, imgH);
        ctx.drawImage(frameImg, 0, 0, frameImg.width, frameImg.height, x, y, imgW, imgH);
      }
    } else {
      for (let i = 0; i < photoCount; i++) {
        const img = new window.Image();
        img.src = capturedImages[i];
        // eslint-disable-next-line no-await-in-loop
        await new Promise((res) => { img.onload = res; });
        const x = PADDING;
        const y = PADDING + i * (imgH + MARGIN);
        drawImageCover(ctx, img, x, y, imgW, imgH);
        ctx.drawImage(frameImg, 0, 0, frameImg.width, frameImg.height, x, y, imgW, imgH);
      }
    }
    // Vẽ text dưới cùng
    ctx.fillStyle = '#222';
    ctx.font = `${20 * SCALE}px Arial`;
    ctx.textAlign = 'center';
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    ctx.fillText(`${dateStr}   ${timeStr}`, width / 2, height - PADDING - 30 * SCALE);
    ctx.font = `${12 * SCALE}px Arial`;
    ctx.fillText('© 2025 AW', width / 2, height - PADDING - 10 * SCALE);
    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, 'photobooth-photo.png');
      }
    });
  };

  const resetPhotos = () => {
    setCapturedImages([]);
    setRemainingPhotos(0);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Photobooth Mùa Hè
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 2, position: 'relative' }}>
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                style={{ width: '100%', height: 'auto' }}
              />
              {showCountdown && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CountdownTimer onComplete={handleCountdownComplete} />
                </Box>
              )}
              {isCapturing && !showCountdown && (
                <Typography
                  variant="h6"
                  sx={{
                    position: 'absolute',
                    top: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '4px',
                  }}
                >
                  Còn {remainingPhotos} ảnh
                </Typography>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Chọn Layout
              </Typography>
              <Grid container spacing={1}>
                {['2pose', '3pose', '4pose', '6pose'].map((layoutType) => (
                  <Grid item xs={6} key={layoutType}>
                    <Button
                      variant={layout === layoutType ? 'contained' : 'outlined'}
                      fullWidth
                      onClick={() => setLayout(layoutType as LayoutType)}
                      disabled={isCapturing}
                    >
                      {layoutType}
                    </Button>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={startCapture}
                  disabled={isCapturing}
                  sx={{ mb: 1 }}
                >
                  Chụp ảnh
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  onClick={resetPhotos}
                  disabled={capturedImages.length === 0 || isCapturing}
                >
                  Chụp lại
                </Button>
              </Box>
            </Paper>
          </Grid>

          {capturedImages.length > 0 && (
            <Grid item xs={12}>
              <Paper
                ref={photoContainerRef}
                elevation={3}
                sx={{ p: 2, position: 'relative' }}
              >
                <PhotoLayout
                  layout={layout}
                  images={capturedImages}
                />
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={savePhoto}
                  sx={{ mt: 2 }}
                >
                  Tải ảnh về máy
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </Container>
  );
};

export default App; 