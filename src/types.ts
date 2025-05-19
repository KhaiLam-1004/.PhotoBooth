export type LayoutType = '2pose' | '3pose' | '4pose' | '6pose';

export interface PhotoLayoutProps {
  layout: LayoutType;
  images: string[];
}

export interface CountdownTimerProps {
  onComplete: () => void;
} 