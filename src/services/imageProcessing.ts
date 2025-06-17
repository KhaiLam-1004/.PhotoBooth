// Dynamic import for MediaPipe to avoid TypeScript issues
let FaceLandmarker: any = null;

export interface FilterOptions {
  skinSmoothingIntensity: number;
  brightnessEnhancement: number;
  contrastEnhancement: number;
  saturationEnhancement: number;
}

export class AdvancedImageProcessor {
  private static instance: AdvancedImageProcessor;
  private faceLandmarker: any = null;
  private isInitialized = false;

  private constructor() {
    this.initializeMediaPipe();
  }

  public static getInstance(): AdvancedImageProcessor {
    if (!AdvancedImageProcessor.instance) {
      AdvancedImageProcessor.instance = new AdvancedImageProcessor();
    }
    return AdvancedImageProcessor.instance;
  }

  private async initializeMediaPipe(): Promise<void> {
    console.log('⏳ Initializing MediaPipe FaceLandmarker...');
    try {
      // Dynamic import to avoid TypeScript issues
      const { FaceLandmarker: FL } = await import('@mediapipe/tasks-vision');
      FaceLandmarker = FL;
      
      // Initialize FaceLandmarker with proper error handling
      this.faceLandmarker = await FaceLandmarker.createFromOptions({
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "IMAGE",
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });
      this.isInitialized = true;
      console.log('✅ MediaPipe FaceLandmarker initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MediaPipe FaceLandmarker:', error);
      this.isInitialized = false;
    }
  }

  public async applyAdvancedFilters(
    imageSrc: string, 
    options: FilterOptions
  ): Promise<string> {
    console.log('🚀 Starting advanced filter processing with options:', options);
    console.log('📸 Input image source length:', imageSrc.length);
    
    if (!this.isInitialized || !this.faceLandmarker) {
      console.error('❌ FaceLandmarker is not initialized. isInitialized:', this.isInitialized, 'faceLandmarker:', !!this.faceLandmarker);
      throw new Error('FaceLandmarker is not initialized.');
    }

    try {
      console.log('🔄 Loading image...');
      const img = await this.loadImage(imageSrc);
      console.log('✅ Image loaded successfully. Dimensions:', img.width, 'x', img.height);
      
      // Create a canvas to draw the image and get ImageData
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      console.log('✅ Canvas created and image drawn. Canvas size:', canvas.width, 'x', canvas.height);

      // Detect face landmarks
      console.log('🔍 Starting face detection...');
      const detections = this.faceLandmarker.detect(img);
      console.log('✅ MediaPipe FaceLandmarker detections:', detections);
      console.log('📊 Number of faces detected:', detections?.faceLandmarks?.length || 0);

      if (detections && detections.faceLandmarks.length > 0) {
        console.log('🎯 Face detected! Applying face beautification...');
        const faceLandmarks = detections.faceLandmarks[0];
        console.log('📍 Number of landmarks:', faceLandmarks.length);

        // Apply smoothing and enhancements directly on the canvas using the landmarks
        this.applyFaceBeautificationOnCanvas(ctx, canvas, faceLandmarks, options);
      } else {
        console.log('⚠️ No face detected, applying global filters only...');
        // If no face detected, apply global filters only
        this.applyGlobalFilters(ctx, canvas, options);
      }
      
      console.log('🔄 Converting canvas to data URL...');
      const result = canvas.toDataURL('image/jpeg', 0.9);
      console.log('✅ Advanced filter processing completed successfully');
      console.log('📸 Output image source length:', result.length);
      
      return result;
    } catch (error) {
      console.error('❌ Error applying advanced filters:', error);
      console.error('❌ Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      throw error; 
    }
  }

  private async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  private applyGlobalFilters(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    options: FilterOptions
  ) {
    console.log('🎨 Applying global filters with options:', options);
    const { width, height } = canvas;

    // Create a temporary canvas for processing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(canvas, 0, 0);

    // Apply brightness, contrast, saturation
    const filters: string[] = [];
    if (options.brightnessEnhancement > 0) {
      const brightnessFactor = 1 + options.brightnessEnhancement * 1.0;
      filters.push(`brightness(${brightnessFactor})`);
      console.log('💡 Applied brightness filter:', brightnessFactor);
    }
    if (options.contrastEnhancement > 0) {
      const contrastFactor = 1 + options.contrastEnhancement * 2.0;
      filters.push(`contrast(${contrastFactor})`);
      console.log('⚡ Applied contrast filter:', contrastFactor);
    }
    if (options.saturationEnhancement > 0) {
      const saturationFactor = 1 + options.saturationEnhancement * 2.0;
      filters.push(`saturate(${saturationFactor})`);
      console.log('🌈 Applied saturation filter:', saturationFactor);
    }

    if (filters.length > 0) {
      console.log('🎯 Applying CSS filters:', filters.join(' '));
      ctx.filter = filters.join(' ');
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.filter = 'none'; // Reset filter
      console.log('✅ Global filters applied successfully');
    } else {
      console.log('⚠️ No global filters to apply');
    }

    tempCanvas.remove();
  }

  private applyFaceBeautificationOnCanvas(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    faceLandmarks: any, // MediaPipe FaceLandmarker result type
    options: FilterOptions
  ) {
    const { width, height } = canvas;

    // 1. Create a temporary canvas for the original image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(canvas, 0, 0);

    // 2. Create a mask for the face area
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d')!;

    // Draw the face outline from MediaPipe landmarks to create a mask
    if (faceLandmarks && faceLandmarks.length > 0) {
      maskCtx.fillStyle = 'white';
      maskCtx.beginPath();
      
      // Create a simplified face mask using key landmarks
      const points = faceLandmarks.map((p: any) => ({ x: p.x * width, y: p.y * height }));
      if (points.length > 0) {
        maskCtx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          maskCtx.lineTo(points[i].x, points[i].y);
        }
        maskCtx.closePath();
        maskCtx.fill();
      }
    }

    // 3. Apply smoothing (blur) selectively to the masked area
    if (options.skinSmoothingIntensity > 0) {
      const blurRadius = options.skinSmoothingIntensity * 10; // Adjust as needed

      // Apply blur to the temporary canvas with the original image
      tempCtx.filter = `blur(${blurRadius}px)`;
      tempCtx.drawImage(canvas, 0, 0);
      tempCtx.filter = 'none'; // Reset filter for tempCtx

      // Use the mask to clip the blurred image
      ctx.globalCompositeOperation = 'source-over'; // Reset to default
      ctx.drawImage(canvas, 0, 0); // Redraw original on main canvas
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(maskCanvas, 0, 0); // Apply mask
      ctx.globalCompositeOperation = 'source-over'; // Reset for next operations
      ctx.drawImage(tempCanvas, 0, 0); // Draw blurred image into the masked area
    }

    // 4. Apply global filters
    this.applyGlobalFilters(ctx, canvas, options);

    // Clean up temporary canvases
    tempCanvas.remove();
    maskCanvas.remove();
  }
}

// Export singleton instance
export const imageProcessor = AdvancedImageProcessor.getInstance();