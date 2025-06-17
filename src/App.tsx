import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Box, Button, Typography, Paper, Grid, Container, TextField } from '@mui/material';
import Webcam from 'react-webcam';
import html2canvas from 'html2canvas';
import CountdownTimer from './components/CountdownTimer';
import { debounce } from 'lodash';

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

// Danh sách font viết tay đẹp
const HANDWRITING_FONTS = [
  // Google Fonts (có sẵn và đáng tin cậy)
  { name: 'Brush Script MT', value: 'Brush Script MT, cursive' },
  { name: 'Dancing Script', value: '"Dancing Script", cursive' },
  { name: 'Pacifico', value: '"Pacifico", cursive' },
  { name: 'Satisfy', value: '"Satisfy", cursive' },
  { name: 'Great Vibes', value: '"Great Vibes", cursive' },
  { name: 'Alex Brush', value: '"Alex Brush", cursive' },
  { name: 'Allura', value: '"Allura", cursive' },
  { name: 'Caveat', value: '"Caveat", cursive' },
  { name: 'Indie Flower', value: '"Indie Flower", cursive' },
  { name: 'Kalam', value: '"Kalam", cursive' },
  { name: 'Shadows Into Light', value: '"Shadows Into Light", cursive' },
  { name: 'Permanent Marker', value: '"Permanent Marker", cursive' },
  { name: 'Cedarville Cursive', value: '"Cedarville Cursive", cursive' },
  { name: 'Homemade Apple', value: '"Homemade Apple", cursive' },
  { name: 'Reenie Beanie', value: '"Reenie Beanie", cursive' },
  { name: 'Rock Salt', value: '"Rock Salt", cursive' },
  { name: 'Sacramento', value: '"Sacramento", cursive' },
  { name: 'Yellowtail', value: '"Yellowtail", cursive' },
  { name: 'Zeyada', value: '"Zeyada", cursive' },
  { name: 'Just Another Hand', value: '"Just Another Hand", cursive' },
  
  // Thêm các font viết tay đẹp khác từ Google Fonts
  { name: 'Marck Script', value: '"Marck Script", cursive' },
  { name: 'Patrick Hand', value: '"Patrick Hand", cursive' },
  { name: 'Architects Daughter', value: '"Architects Daughter", cursive' },
  { name: 'Gloria Hallelujah', value: '"Gloria Hallelujah", cursive' },
  { name: 'Bangers', value: '"Bangers", cursive' },
  { name: 'Fredoka One', value: '"Fredoka One", cursive' },
  { name: 'Righteous', value: '"Righteous", cursive' },
  { name: 'Lobster', value: '"Lobster", cursive' },
  { name: 'Bungee Shade', value: '"Bungee Shade", cursive' },
  { name: 'Press Start 2P', value: '"Press Start 2P", cursive' },
  { name: 'VT323', value: '"VT323", monospace' },
  { name: 'Orbitron', value: '"Orbitron", sans-serif' },
  { name: 'Audiowide', value: '"Audiowide", cursive' },
  { name: 'Russo One', value: '"Russo One", sans-serif' },
  { name: 'Bungee', value: '"Bungee", cursive' },
  { name: 'Monoton', value: '"Monoton", cursive' },
  { name: 'Faster One', value: '"Faster One", cursive' },
  { name: 'Freckle Face', value: '"Freckle Face", cursive' },
  { name: 'Finger Paint', value: '"Finger Paint", cursive' },
  { name: 'Eater', value: '"Eater", cursive' },
  { name: 'Creepster', value: '"Creepster", cursive' },
  { name: 'Butcherman', value: '"Butcherman", cursive' },
  { name: 'Astloch', value: '"Astloch", serif' },
  { name: 'Abril Fatface', value: '"Abril Fatface", cursive' },
  { name: 'Playfair Display', value: '"Playfair Display", serif' },
  { name: 'Dancing Script Bold', value: '"Dancing Script", cursive' },
  { name: 'Caveat Bold', value: '"Caveat", cursive' },
  { name: 'Kalam Bold', value: '"Kalam", cursive' },
];

// Hàm tạo ảnh tổng hợp (merge ảnh + frame + text) bằng canvas, trả về data URL
async function generateCompositeImage(images: string[], frameUrl: string, layout: string, backgroundColor: string, customMessage: string, textColor: string, fontSize: number, fontFamily: string): Promise<string | null> {
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
    ctx.font = `${fontSize}px ${fontFamily}`; // Use the selected font size and family
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

// Hàm làm mịn da sử dụng Canvas API (tối ưu hóa)
async function applySkinSmoothingFilter(imageSrc: string, intensity: number): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Reduce image size for better performance
      const maxSize = 800;
      let { width, height } = img;
      
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (!ctx) {
        resolve(imageSrc);
        return;
      }
      
      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Vẽ ảnh gốc với kích thước tối ưu
      ctx.drawImage(img, 0, 0, width, height);
      
      // Lấy dữ liệu pixel
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // Tạo bản sao để xử lý
      const processedData = new Uint8ClampedArray(data);
      
      // Bước 1: Phát hiện vùng da (tối ưu hóa)
      const skinMask = detectSkinAreas(data, width, height);
      
      // Bước 2: Áp dụng Gaussian blur cho vùng da (giảm radius cho hiệu suất)
      const optimizedRadius = Math.max(1, Math.floor(intensity * 2)); // Giảm từ 3 xuống 2
      applyGaussianBlur(data, processedData, skinMask, width, height, optimizedRadius);
      
      // Bước 3: Tăng độ sáng cho vùng da
      enhanceSkinTone(processedData, skinMask, intensity);
      
      // Cập nhật canvas với dữ liệu đã xử lý
      const newImageData = new ImageData(processedData, width, height);
      ctx.putImageData(newImageData, 0, 0);
      
      resolve(canvas.toDataURL('image/jpeg', 0.9)); // Giảm quality từ 0.95 xuống 0.9
    };
    
    img.src = imageSrc;
  });
}

// Hàm phát hiện vùng da
function detectSkinAreas(data: Uint8ClampedArray, width: number, height: number): boolean[] {
  const skinMask = new Array(width * height).fill(false);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Điều kiện phát hiện da đơn giản
    const isSkin = (
      r > 95 && g > 40 && b > 20 &&
      Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
      Math.abs(r - g) > 15 && r > g && r > b
    );
    
    skinMask[i / 4] = isSkin;
  }
  
  return skinMask;
}

// Hàm áp dụng Gaussian blur (tối ưu hóa)
function applyGaussianBlur(
  originalData: Uint8ClampedArray, 
  processedData: Uint8ClampedArray, 
  skinMask: boolean[], 
  width: number, 
  height: number, 
  radius: number
) {
  // Giảm radius để tăng hiệu suất
  const maxRadius = Math.min(radius, 5);
  
  for (let y = maxRadius; y < height - maxRadius; y += 2) { // Skip every 2 pixels
    for (let x = maxRadius; x < width - maxRadius; x += 2) { // Skip every 2 pixels
      const idx = (y * width + x) * 4;
      
      // Chỉ xử lý vùng da
      if (!skinMask[y * width + x]) {
        continue;
      }
      
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      
      // Áp dụng blur đơn giản với radius nhỏ hơn
      for (let ky = -maxRadius; ky <= maxRadius; ky += 1) {
        for (let kx = -maxRadius; kx <= maxRadius; kx += 1) {
          const neighborIdx = ((y + ky) * width + (x + kx)) * 4;
          rSum += originalData[neighborIdx];
          gSum += originalData[neighborIdx + 1];
          bSum += originalData[neighborIdx + 2];
          count++;
        }
      }
      
      processedData[idx] = Math.round(rSum / count);
      processedData[idx + 1] = Math.round(gSum / count);
      processedData[idx + 2] = Math.round(bSum / count);
    }
  }
}

// Hàm tăng cường màu da
function enhanceSkinTone(data: Uint8ClampedArray, skinMask: boolean[], intensity: number) {
  for (let i = 0; i < data.length; i += 4) {
    if (skinMask[i / 4]) {
      // Tăng độ sáng nhẹ cho vùng da
      const brightnessBoost = intensity * 15;
      data[i] = Math.min(255, data[i] + brightnessBoost);
      data[i + 1] = Math.min(255, data[i + 1] + brightnessBoost * 0.9);
      data[i + 2] = Math.min(255, data[i + 2] + brightnessBoost * 0.7);
    }
  }
}

// Hàm xử lý tất cả ảnh với filter
async function processImagesWithFilter(images: string[], intensity: number): Promise<string[]> {
  const filteredImages: string[] = [];
  
  for (const image of images) {
    const filteredImage = await applySkinSmoothingFilter(image, intensity);
    filteredImages.push(filteredImage);
  }
  
  return filteredImages;
}

// Memoized components for better performance
const MemoizedImage = React.memo(({ src, alt, style }: { src: string; alt: string; style: React.CSSProperties }) => (
  <img src={src} alt={alt} style={style} loading="lazy" />
));

const MemoizedPlaceholder = React.memo(({ width, height }: { width: number; height: number }) => (
  <Box sx={{ 
    width: `${width}px`,
    height: `${height}px`,
    border: '3px dashed #ddd', 
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <Typography variant="h6">Đang tạo ảnh...</Typography>
  </Box>
));

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

  // New state for skin smoothing filter
  const [enableSkinSmoothing, setEnableSkinSmoothing] = useState<boolean>(false);
  const [skinSmoothingIntensity, setSkinSmoothingIntensity] = useState<number>(0.5);
  const [filteredImages, setFilteredImages] = useState<string[]>([]);
  const [compositePreviewImageWithFilter, setCompositePreviewImageWithFilter] = useState<string | null>(null);
  const [compositePreviewImageWithoutFilter, setCompositePreviewImageWithoutFilter] = useState<string | null>(null);

  // New state for font selection
  const [selectedFont, setSelectedFont] = useState<string>(HANDWRITING_FONTS[0].value);

  const previewRef = useRef<HTMLDivElement>(null);

  // Lấy số ảnh cần chụp theo layout
  const getLayoutPhotoCount = useCallback((layoutType: string): number => {
    const found = LAYOUTS.find(l => l.name === layoutType);
    return found ? found.count : 2;
  }, []);

  // Memoized values for better performance
  const photoCount = useMemo(() => getLayoutPhotoCount(layout), [layout, getLayoutPhotoCount]);
  const imagesToExport = useMemo(() => {
    return (images.length ? images : PLACEHOLDER_IMAGES).slice(0, photoCount);
  }, [images, photoCount]);

  // Optimized image dimensions for better performance
  const imageDimensions = useMemo(() => {
    const baseWidth = 480; // Reduced from original size
    const baseHeight = 360;
    return { width: baseWidth, height: baseHeight };
  }, []);

  // Bắt đầu chụp tự động
  const startCapture = useCallback(() => {
    setImages([]);
    setRemainingPhotos(getLayoutPhotoCount(layout));
    setIsCapturing(true);
    setIsPreview(false);
    setCompositePreviewImage(null); // Clear previous composite image
    setCompositePreviewImageWithFilter(null);
    setCompositePreviewImageWithoutFilter(null);
    setFilteredImages([]);
    setSelectedFont(HANDWRITING_FONTS[0].value); // Reset font to default
    setTimeout(() => setShowCountdown(true), 300);
  }, [layout, getLayoutPhotoCount]);

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

  // Debounced function for generating composite images
  const debouncedGenerateComposite = useCallback(
    debounce(async (imagesToExport: string[], enableFilter: boolean) => {
      try {
        // Generate composite image without filter
        const dataUrl = await generateCompositeImage(
          imagesToExport, 
          selectedFrame, 
          layout, 
          backgroundColor, 
          customMessage, 
          textColor, 
          fontSize, 
          selectedFont
        );
        setCompositePreviewImageWithoutFilter(dataUrl);
        
        if (!enableFilter) {
          setCompositePreviewImage(dataUrl);
        }

        // Generate composite image with filter if enabled
        if (enableFilter) {
          const filteredImages = await processImagesWithFilter(imagesToExport, skinSmoothingIntensity);
          setFilteredImages(filteredImages);
          
          const filteredDataUrl = await generateCompositeImage(
            filteredImages, 
            selectedFrame, 
            layout, 
            backgroundColor, 
            customMessage, 
            textColor, 
            fontSize, 
            selectedFont
          );
          setCompositePreviewImageWithFilter(filteredDataUrl);
          setCompositePreviewImage(filteredDataUrl);
        }
      } catch (error) {
        console.error("Error generating composite image:", error);
      }
    }, 300), // 300ms delay
    [selectedFrame, layout, backgroundColor, customMessage, textColor, fontSize, selectedFont, skinSmoothingIntensity]
  );

  // Generate composite image for preview when images/layout/background color/custom message/text color/font size change and is in preview mode
  useEffect(() => {
    if (isPreview && images.length > 0) {
      const photoCount = getLayoutPhotoCount(layout);
      const imagesToExport = (images.length ? images : PLACEHOLDER_IMAGES).slice(0, photoCount);
      
      debouncedGenerateComposite(imagesToExport, enableSkinSmoothing);
    }
  }, [isPreview, images, debouncedGenerateComposite, enableSkinSmoothing]);

  // Handle filter toggle
  useEffect(() => {
    if (isPreview && compositePreviewImageWithoutFilter) {
      if (enableSkinSmoothing && compositePreviewImageWithFilter) {
        setCompositePreviewImage(compositePreviewImageWithFilter);
      } else {
        setCompositePreviewImage(compositePreviewImageWithoutFilter);
      }
    }
  }, [enableSkinSmoothing, compositePreviewImageWithoutFilter, compositePreviewImageWithFilter, isPreview]);

  // Chụp ảnh
  const capturePhoto = useCallback(() => {
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
  }, [images.length, layout, getLayoutPhotoCount]);

  // Giao diện preview đơn giản với sticker overlay
  const renderPreview = () => (
    <Box sx={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(120deg, #ffe0ef 0%, #fff 100%)', p: 2, flexDirection: 'column' }}>
      {/* Main content area */}
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 4, width: '100%', maxWidth: '1400px' }}>
        
        {/* Left side - Image preview */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <Typography variant="h4" sx={{ mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
          PhotoBooth Summer
          </Typography>
          
          {/* Side-by-side image comparison */}
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, justifyContent: 'center', alignItems: 'flex-start', width: '100%' }}>
            {/* Original image without filter */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ mb: 1, textAlign: 'center', color: '#666' }}>
                Ảnh gốc
              </Typography>
              {compositePreviewImageWithoutFilter ? (
                <MemoizedImage 
                  src={compositePreviewImageWithoutFilter} 
                  alt="Original photo strip" 
                  style={{
                    maxWidth: '480px',
                    height: 'auto', 
                    borderRadius: '0.75rem',
                    border: '3px solid #ddd'
                  }}
                />
              ) : (
                <MemoizedPlaceholder width={480} height={360} />
              )}
            </Box>

            {/* Filtered image */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ mb: 1, textAlign: 'center', color: '#666' }}>
                Ảnh Filter
              </Typography>
              {compositePreviewImageWithFilter ? (
                <MemoizedImage 
                  src={compositePreviewImageWithFilter} 
                  alt="Filtered photo strip" 
                  style={{
                    maxWidth: '480px',
                    height: 'auto', 
                    borderRadius: '0.75rem',
                    border: '3px solid #4caf50'
                  }}
                />
              ) : (
                <MemoizedPlaceholder width={480} height={360} />
              )}
            </Box>
          </Box>

          {/* Filter controls - moved below images */}
          <Box sx={{ 
            border: '1px solid #e0e0e0', 
            borderRadius: '8px', 
            padding: '15px', 
            backgroundColor: '#fafafa',
            mt: 3,
            width: '100%',
            maxWidth: '960px' // Match the width of both images
          }}>
            <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
              🎨 Filter làm mịn da
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, justifyContent: 'center' }}>
              <Typography variant="body1" sx={{ color: '#222' }}>Bật filter:</Typography>
              <Button
                variant={enableSkinSmoothing ? 'contained' : 'outlined'}
                color={enableSkinSmoothing ? 'success' : 'inherit'}
                onClick={() => setEnableSkinSmoothing(!enableSkinSmoothing)}
                sx={{ minWidth: '80px' }}
              >
                {enableSkinSmoothing ? 'Bật' : 'Tắt'}
              </Button>
            </Box>

            {enableSkinSmoothing && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                <Typography variant="body1" sx={{ color: '#222', minWidth: '120px' }}>Cường độ:</Typography>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1" 
                  step="0.1" 
                  value={skinSmoothingIntensity} 
                  onChange={(e) => setSkinSmoothingIntensity(Number(e.target.value))}
                  style={{ width: '200px' }}
                />
                <Typography variant="body2" sx={{ color: '#666', minWidth: '40px' }}>
                  {Math.round(skinSmoothingIntensity * 100)}%
                </Typography>
              </Box>
            )}
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                const imageToDownload = enableSkinSmoothing && compositePreviewImageWithFilter 
                  ? compositePreviewImageWithFilter 
                  : compositePreviewImageWithoutFilter;
                
                if (imageToDownload) {
                  const link = document.createElement('a');
                  link.href = imageToDownload;
                  link.download = `photobooth-${new Date().getTime()}.png`;
                  link.click();
                }
              }}
              sx={{
                borderRadius: 9999,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
              }}
            >
              💾 Tải xuống ảnh
            </Button>
            
            <Button
              variant="outlined" 
              color="secondary"
              onClick={() => {
                setImages([]);
                setIsPreview(false);
                setIsCapturing(false);
                setShowCountdown(false);
                setRemainingPhotos(getLayoutPhotoCount(layout));
                setCompositePreviewImage(null);
                setCompositePreviewImageWithFilter(null);
                setCompositePreviewImageWithoutFilter(null);
                setFilteredImages([]);
              }}
              sx={{
                borderRadius: 9999,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
              }}
            >
              🔄 Chụp lại
            </Button>
          </Box>
        </Box>

        {/* Right side - Customization options */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '400px', minWidth: '400px' }}>
          <Typography variant="h5" sx={{ mb: 2, textAlign: 'center' }}>
            Tùy chỉnh ảnh
          </Typography>

          {/* Chọn Khung Sticker */}
          <Box sx={{ 
            border: '1px solid #e0e0e0', 
            borderRadius: '8px', 
            padding: '10px', 
            backgroundColor: '#fafafa',
            mb: 2,
            width: '100%'
          }}>
            <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
              Chọn Khung Sticker
            </Typography>
            <Grid container spacing={2} justifyContent="center"> 
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
                        borderColor: '#2196d2', 
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

          {/* Chọn Màu Nền */}
          <Box sx={{ 
            border: '1px solid #e0e0e0', 
            borderRadius: '8px', 
            padding: '10px', 
            backgroundColor: '#fafafa',
            mb: 2,
            width: '100%'
          }}>
            <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
              Chọn Màu Nền
            </Typography>
            <Grid container spacing={2} justifyContent="center"> 
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
                    <TextField
                      variant="outlined"
                      size="small"
                      placeholder="#ffffff"
                      value={backgroundColor}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.match(/^#[0-9A-Fa-f]{6}$/) || value === '') {
                          setBackgroundColor(value);
                        }
                      }}
                      inputProps={{
                        maxLength: 7,
                        style: { 
                          fontSize: '12px',
                          textTransform: 'uppercase'
                        }
                      }}
                      sx={{ 
                        width: '100px',
                        '& .MuiOutlinedInput-root': {
                          height: '40px'
                        }
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
          </Box>

          {/* Tùy chỉnh Văn bản */}
          <Box sx={{ 
            border: '1px solid #e0e0e0', 
            borderRadius: '8px', 
            padding: '10px', 
            backgroundColor: '#fafafa',
            mb: 2,
            width: '100%'
          }}>
            <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
              Tùy chỉnh Văn bản
            </Typography>
            
            {/* Font Preview */}
            <Box sx={{ 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              padding: '10px', 
              backgroundColor: '#fff',
              mb: 2,
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontFamily: selectedFont,
                  fontSize: `${fontSize}px`,
                  color: textColor,
                  textAlign: 'center',
                  wordBreak: 'break-word'
                }}
              >
                {customMessage || 'Xem trước font chữ của bạn...'}
              </Typography>
            </Box>
            
            <TextField
              label="Nhập tin nhắn của bạn"
              variant="outlined"
              fullWidth
              multiline
              rows={2}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              sx={{ mb: 2 }}
            />

            {/* Font Selection */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ color: '#222', mb: 1, textAlign: 'center' }}>
                Chọn Font Chữ:
              </Typography>
              <select
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}
              >
                {HANDWRITING_FONTS.map((font) => (
                  <option 
                    key={font.value} 
                    value={font.value} 
                    style={{ 
                      fontFamily: font.value,
                      fontSize: '14px',
                      padding: '4px'
                    }}
                  >
                    {font.name}
                  </option>
                ))}
              </select>
            </Box>

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
    </Box>
  );

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
                          fontSize,
                          selectedFont
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
                    setIsCapturing(false);
                    setShowCountdown(false);
                    setRemainingPhotos(getLayoutPhotoCount(layout));
                  }}
                  disabled={!isCapturing && images.length === 0} // Chỉ cho phép reset khi đang chụp hoặc đã có ảnh
                >
                  Reset
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );

  return (
    <React.Fragment>
      {!isPreview ? renderCapture() : renderPreview()}
    </React.Fragment>
  );
} 