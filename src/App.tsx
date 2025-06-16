import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Typography, Paper, Grid, Container, TextField } from '@mui/material';
import Webcam from 'react-webcam';
import html2canvas from 'html2canvas';
import CountdownTimer from './components/CountdownTimer';

const FRAME_COLORS = [
  { name: 'White', value: '#fff' },
  { name: 'Black', value: '#222' },
  { name: 'Pink', value: '#f8bbd0' },
  { name: 'Green', value: '#a5d6a7' },
  { name: 'Blue', value: '#90caf9' },
  { name: 'Yellow', value: '#fff59d' },
  { name: 'Purple', value: '#ce93d8' },
  { name: 'Maroon', value: '#8d6e63' },
  { name: 'Burgundy', value: '#6d4c41' },
];

const FRAME_STICKERS = [
  { name: 'Summer 1', value: '/.PhotoBooth/frame_summer.png' },
  { name: 'Summer 2', value: '/.PhotoBooth/frame_summer_1.png' },
  { name: 'Summer 3', value: '/.PhotoBooth/frame_summer_2.png' },
  { name: 'Summer 4', value: '/.PhotoBooth/frame_summer_3.png' },
  { name: 'Summer 5', value: '/.PhotoBooth/frame_summer_4.png' },
  { name: 'Summer 6', value: '/.PhotoBooth/frame_summer_5.png' },
  { name: 'Summer 7', value: '/.PhotoBooth/frame_summer_6.png' },
  { name: 'Summer 8', value: '/.PhotoBooth/frame_summer_7.png' },
];

const LAYOUTS = [
  { name: '2pose', label: '2pose', count: 2 },
  { name: '3pose', label: '3pose', count: 3 },
  { name: '4pose', label: '4pose', count: 4 },
  { name: '6pose', label: '6pose', count: 6 },
];

const PLACEHOLDER_IMAGES = [
  '/.PhotoBooth/sample1.jpg',
  '/.PhotoBooth/sample2.jpg',
  '/.PhotoBooth/sample3.jpg',
  '/.PhotoBooth/sample4.jpg',
  '/.PhotoBooth/sample5.jpg',
  '/.PhotoBooth/sample6.jpg',
];

const FRAME_IMAGE = '/.PhotoBooth/frame_summer.png';

const FRAME_WIDTH = 700;
const FRAME_HEIGHT = 540;
const PHOTO_WIDTH = 640;
const PHOTO_HEIGHT = 360;
const PHOTO_LEFT = 30;
const PHOTO_TOP = 90;

// Hàm tạo ảnh tổng hợp (merge ảnh + frame + text) bằng canvas, trả về data URL
async function generateCompositeImage(images: string[], frameUrl: string, layout: string, backgroundColor: string, customMessage: string, textColor: string, fontSize: number): Promise<string | null> {
  // Kích thước frame PNG (700x540, vùng ảnh 640x360 tại (30,90))
  const frameW = 700, frameH = 540, photoW = 640, photoH = 360, photoX = 30, photoY = 90;
  let cols = 1, rows = images.length;
  if (layout === '4pose') { cols = 2; rows = 2; }
  if (layout === '6pose') { cols = 2; rows = 3; }
  if (layout === '3pose') { cols = 1; rows = 3; }
  if (layout === '2pose') { cols = 1; rows = 2; }
  const margin = 40, gap = 20;

  // Calculate canvas dimensions based on layout
  const canvasW = cols * frameW + (cols - 1) * gap + 2 * margin;
  const canvasH = rows * frameH + (rows - 1) * gap + 2 * margin + 80; // Extra space for date/time

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = backgroundColor; // Use the selected background color
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Load frame image once
  const frameImg = await loadImage(frameUrl);

  // Draw each photo within its frame
  for (let i = 0; i < images.length; i++) {
    const img = await loadImage(images[i]);
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = margin + col * (frameW + gap);
    const y = margin + row * (frameH + gap);

    // Draw photo (scaled to fit, centered within photo area)
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + photoX, y + photoY, photoW, photoH);
    ctx.clip();
    const scale = Math.min(photoW / img.width, photoH / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const dx = x + photoX + (photoW - drawW) / 2;
    const dy = y + photoY + (photoH - drawH) / 2;
    ctx.drawImage(img, dx, dy, drawW, drawH);
    ctx.restore();

    // Draw frame on top
    ctx.drawImage(frameImg, x, y, frameW, frameH);
  }

  // Add custom message
  if (customMessage) {
    ctx.fillStyle = textColor; // Use the selected text color
    ctx.font = `${fontSize}px sans-serif`; // Use the selected font size
    ctx.textAlign = 'center';

    const lines = customMessage.split('\n');
    const lineHeight = fontSize + 7; // Khoảng cách giữa các dòng, dựa trên font size
    let startY = canvasH - 40 - (lines.length - 1) * lineHeight / 2; 

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], canvasW / 2, startY + i * lineHeight);
    }
  }

  // Helper function to load image
  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((res, rej) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });
  }

  return canvas.toDataURL('image/png');
}

export default function App() {
  const [frameColor, setFrameColor] = useState('#fff');
  const [customColor, setCustomColor] = useState('#fff');
  const [images, setImages] = useState<string[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [remainingPhotos, setRemainingPhotos] = useState(2);
  const [layout, setLayout] = useState('2pose');
  const [compositePreviewImage, setCompositePreviewImage] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>('#fff');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [textColor, setTextColor] = useState<string>('#222');
  const [fontSize, setFontSize] = useState<number>(28);
  const [selectedFrame, setSelectedFrame] = useState<string>('/.PhotoBooth/frame_summer.png');
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3);

  const previewRef = useRef<HTMLDivElement>(null);

  // Lấy số ảnh cần chụp theo layout
  const getLayoutPhotoCount = (layoutType: string): number => {
    const found = LAYOUTS.find(l => l.name === layoutType);
    return found ? found.count : 2;
  };

  // Bắt đầu chụp tự động
  const startCapture = () => {
    setImages([]);
    setRemainingPhotos(getLayoutPhotoCount(layout));
    setIsCapturing(true);
    setIsPreview(false);
    setCompositePreviewImage(null); // Clear previous composite image
    setTimeout(() => setShowCountdown(true), 300);
  };

  // Tự động kích hoạt đếm ngược cho ảnh tiếp theo hoặc chuyển sang preview
  useEffect(() => {
    if (isCapturing && !showCountdown && images.length > 0 && images.length < getLayoutPhotoCount(layout)) {
      const timer = setTimeout(() => setShowCountdown(true), 800);
      return () => clearTimeout(timer);
    }
    if (images.length === getLayoutPhotoCount(layout) && isCapturing) {
      setTimeout(() => {
        setIsCapturing(false);
        setIsPreview(true);
      }, 500);
    }
  }, [images, isCapturing, showCountdown, layout]);

  // Generate composite image for preview when images/layout/background color/custom message/text color/font size change and is in preview mode
  useEffect(() => {
    if (isPreview && images.length > 0) {
      const photoCount = getLayoutPhotoCount(layout);
      const imagesToExport = (images.length ? images : PLACEHOLDER_IMAGES).slice(0, photoCount);
      generateCompositeImage(imagesToExport, selectedFrame, layout, backgroundColor, customMessage, textColor, fontSize)
        .then(dataUrl => {
          setCompositePreviewImage(dataUrl);
        })
        .catch(error => console.error("Error generating composite image:", error));
    }
  }, [isPreview, images, layout, backgroundColor, customMessage, textColor, fontSize, selectedFrame]);

  // Chụp ảnh
  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setImages(prev => [...prev, imageSrc]);
        setRemainingPhotos(prev => prev - 1);
        
        // Kiểm tra nếu đã chụp đủ ảnh thì dừng chụp
        if (images.length + 1 >= getLayoutPhotoCount(layout)) {
          setIsCapturing(false);
          setShowCountdown(false);
        }
      }
    }
  };

  // Giao diện preview đơn giản với sticker overlay
  const renderPreview = () => (
    <Box sx={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(120deg, #ffe0ef 0%, #fff 100%)', p: 2, flexDirection: 'column' }}>
      {/* New Box to contain image and color picker side-by-side */}
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        {compositePreviewImage ? (
          <img 
            src={compositePreviewImage} 
            alt="Photo strip preview" 
            style={{
              maxWidth: '28%', // Adjusted for better visual balance with side options
              height: 'auto', 
              borderRadius: '0.75rem' // Match general border-radius of the card
            }}
          />
        ) : (
          <Typography variant="h6">Đang tạo ảnh preview...</Typography>
        )}

        {/* Customization options (text, text color, font size, background color) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '476px' }}>
          <Typography variant="h5" sx={{ mb: 1, textAlign: 'center' }}>
            Customize your photo strip
          </Typography>
          <Typography variant="body2" sx={{ color: '#888', mb: 2, textAlign: 'center' }}>
            Frame colour
          </Typography>

          {/* Chọn Khung Sticker - moved to top */}
          <Box sx={{ 
            border: '1px solid #e0e0e0', 
            borderRadius: '8px', 
            padding: '10px', 
            backgroundColor: '#fafafa',
            mt: 2,
            width: '100%',
            maxWidth: '1387px'
          }}>
            <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
              Chọn Khung Sticker
            </Typography>
            <Grid container spacing={2} justifyContent="center" sx={{ width: '100%', maxWidth: '1387px' }}> 
              {FRAME_STICKERS.map((frame) => (
                <Grid item xs={6} key={frame.name}> 
                  <Button
                    fullWidth
                    onClick={() => setSelectedFrame(frame.value)}
                    sx={{
                      borderRadius: 9999, 
                      border: '1px solid #000', 
                      color: '#000', 
                      backgroundColor: '#fff', 
                      // Conditional styling for selected button
                      ...(selectedFrame === frame.value && {
                        backgroundColor: '#e3f2fd', 
                        borderColor: '#2196f3', 
                        color: '#1976d2',
                      }),
                      // Hover effect
                      '&:hover': {
                        backgroundColor: '#eee', 
                        borderColor: '#000',
                      },
                    }}
                  >
                    {frame.name}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box sx={{ 
            border: '1px solid #e0e0e0', 
            borderRadius: '8px', 
            padding: '10px', 
            backgroundColor: '#fafafa',
            mt: 2,
            width: '100%',
            maxWidth: '1387px'
          }}>
            <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
              Chọn Màu Nền
            </Typography>
            <Grid container spacing={2} justifyContent="center" sx={{ width: '100%', maxWidth: '1387px' }}> 
              {FRAME_COLORS.map((color) => (
                <Grid item xs={6} key={color.name}> 
                  <Button
                    fullWidth
                    onClick={() => setBackgroundColor(color.value)}
                    sx={{
                      borderRadius: 9999, 
                      border: '1px solid #000', 
                      color: '#000', 
                      backgroundColor: '#fff', 
                      // Conditional styling for selected button
                      ...(backgroundColor === color.value && {
                        backgroundColor: color.value,
                        color: color.name === 'White' ? '#333' : '#fff', 
                        borderColor: color.value, 
                      }),
                      // Hover effect
                      '&:hover': {
                        backgroundColor: '#eee', 
                        borderColor: '#000',
                      },
                    }}
                  >
                    {color.name}
                  </Button>
                </Grid>
              ))}
                <Grid item xs={12} sx={{ mt: 2 }}> 
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                    <Typography variant="body1" sx={{ color: '#222' }}>Custom:</Typography>
                    <Box sx={{
                      width: '40px',
                      height: '40px',
                      border: '2px solid #ccc',
                      borderRadius: '4px',
                      overflow: 'hidden', 
                    }}>
                      <input 
                        type="color" 
                        value={backgroundColor} 
                        onChange={(e) => setBackgroundColor(e.target.value)} 
                        style={{
                          width: '120%', 
                          height: '120%',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          transform: 'translate(-10%, -10%)', 
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
          </Box>

          {/* Group for Custom Text, Color, and Size - moved to bottom */}
          <Box sx={{ 
            border: '1px solid #e0e0e0', 
            borderRadius: '8px', 
            padding: '10px', 
            backgroundColor: '#fafafa',
            mt: 2,
            width: '100%',
            maxWidth: '1387px'
          }}>
            <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
              Tùy chỉnh Văn bản
            </Typography>
            <TextField
              label="Nhập tin nhắn của bạn"
              variant="outlined"
              fullWidth
              multiline
              rows={2}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              sx={{ mb: 1 }}
            />

            {/* Color and Size Pickers side-by-side */}
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, justifyContent: 'center', width: '100%' }}>
              {/* Chọn Màu Chữ section */}
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, gap: 1, justifyContent: 'center' }}>
                <Typography variant="body1" sx={{ color: '#222', whiteSpace: 'nowrap' }}>Màu:</Typography>
                <Box sx={{
                  width: '40px',
                  height: '40px',
                  border: '2px solid #ccc',
                  borderRadius: '4px',
                  overflow: 'hidden', 
                }}>
                  <input 
                    type="color" 
                    value={textColor} 
                    onChange={(e) => setTextColor(e.target.value)} 
                    style={{
                      width: '120%', 
                      height: '120%',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      transform: 'translate(-10%, -10%)', 
                    }}
                  />
                </Box>
              </Box>

              {/* Chọn Kích Cỡ Chữ section */}
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, gap: 1, justifyContent: 'center' }}>
                <Typography variant="body1" sx={{ color: '#222', whiteSpace: 'nowrap' }}>Kích cỡ (px):</Typography>
                <TextField
                  variant="outlined"
                  size="small" // Make it smaller
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  inputProps={{ min: 10, max: 100 }} 
                  sx={{ width: '80px' }} // Set a fixed width
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Buttons below the image and customization options */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
        <Button 
          variant="outlined" 
          onClick={() => {
            setImages([]);
            setIsPreview(false);
            setIsCapturing(false);
            setShowCountdown(false);
            setRemainingPhotos(getLayoutPhotoCount(layout));
            setCompositePreviewImage(null); // Clear composite image when retaking
            setBackgroundColor('#fff'); // Reset background color when retaking
            setCustomMessage(''); // Reset custom message when retaking
            setTextColor('#222'); // Reset text color when retaking
            setFontSize(28); // Reset font size when retaking
            setSelectedFrame('/.PhotoBooth/frame_summer.png'); // Reset frame to default
          }}
          sx={{
            borderRadius: 9999, 
            border: '1px solid #000', 
            color: '#000', 
            backgroundColor: '#fff', 
            px: 3,
            py: 1,
            // Hover effect
            '&:hover': {
              backgroundColor: '#eee', 
              borderColor: '#000',
            },
          }}
        >
          Chụp lại
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={async () => {
            if (compositePreviewImage) {
              const link = document.createElement('a');
              link.download = 'photobooth-photo.png';
              link.href = compositePreviewImage;
              link.click();
            } else {
              console.error("Composite image not available for download.");
            }
          }}
          sx={{
            borderRadius: 9999, 
            border: '1px solid #1976d2', 
            color: '#fff', 
            backgroundColor: '#1976d2', 
            px: 3,
            py: 1,
            // Hover effect
            '&:hover': {
              backgroundColor: '#1565c0', 
              borderColor: '#1565c0',
            },
          }}
        >
          Download
        </Button>
      </Box>
    </Box>
  );

  // Giao diện chụp ảnh
  const renderCapture = () => (
    <Container maxWidth="lg" sx={{ minHeight: '100vh', background: 'linear-gradient(120deg, #ffe0ef 0%, #fff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ my: 4, width: '100%' }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Photobooth Mùa Hè
        </Typography>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 2, position: 'relative', mb: 2 }}>
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: 8 }}
                videoConstraints={{ width: 1280, height: 720, aspectRatio: 16 / 9 }}
              />
              {showCountdown && (
                <CountdownTimer 
                  onComplete={() => {
                    capturePhoto();
                    setShowCountdown(false);
                  }}
                  countdownSeconds={countdownSeconds}
                />
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
                  Còn {getLayoutPhotoCount(layout) - images.length} ảnh
                </Typography>
              )}
            </Paper>

            {/* Hiển thị các ảnh đã chụp */}
            {images.length > 0 && (
              <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
                  Ảnh đã chụp ({images.length}/{getLayoutPhotoCount(layout)})
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 2, 
                  justifyContent: 'center',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  mb: 2
                }}>
                  {images.map((image, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        position: 'relative',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        width: '120px',
                        height: '120px',
                        flexShrink: 0
                      }}
                    >
                      <img 
                        src={image} 
                        alt={`Ảnh ${index + 1}`}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          bottom: '4px',
                          right: '4px',
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem'
                        }}
                      >
                        {index + 1}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                
                {/* Nút Xem Preview - chỉ hiển thị khi đã chụp đủ ảnh */}
                {images.length >= getLayoutPhotoCount(layout) && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={async () => {
                        const compositeImage = await generateCompositeImage(
                          images, 
                          selectedFrame, 
                          layout, 
                          backgroundColor, 
                          customMessage, 
                          textColor, 
                          fontSize
                        );
                        if (compositeImage) {
                          setCompositePreviewImage(compositeImage);
                          setIsPreview(true);
                        }
                      }}
                      sx={{
                        borderRadius: 9999,
                        border: '1px solid #2e7d32',
                        color: '#fff',
                        backgroundColor: '#2e7d32',
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        // Hover effect
                        '&:hover': {
                          backgroundColor: '#1b5e20',
                          borderColor: '#1b5e20',
                        },
                      }}
                    >
                      🎨 Xem Preview
                    </Button>
                  </Box>
                )}
              </Paper>
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Chọn Layout
              </Typography>
              <Grid container spacing={1}>
                {LAYOUTS.map((l) => (
                  <Grid item xs={6} key={l.name}>
                    <Button
                      variant={layout === l.name ? 'contained' : 'outlined'}
                      fullWidth
                      onClick={() => setLayout(l.name)}
                      disabled={isCapturing}
                    >
                      {l.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>
              
              {/* Tùy chọn Countdown */}
              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Thời gian Countdown
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Số giây:
                  </Typography>
                  <TextField
                    variant="outlined"
                    size="small"
                    type="number"
                    value={countdownSeconds}
                    onChange={(e) => setCountdownSeconds(Number(e.target.value))}
                    inputProps={{ 
                      min: 1, 
                      max: 10,
                      step: 1
                    }}
                    sx={{ width: '80px' }}
                    disabled={isCapturing}
                  />
                </Box>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={startCapture}
                  disabled={isCapturing}
                  sx={{ mb: 1 }}
                >
                  Bắt đầu chụp
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  onClick={() => {
                    setImages([]);
                    setIsPreview(false);
                    setIsCapturing(false);
                    setShowCountdown(false);
                    setRemainingPhotos(getLayoutPhotoCount(layout));
                    setCompositePreviewImage(null);
                  }}
                >
                  Chụp lại
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );

  return isPreview ? renderPreview() : renderCapture();
} 