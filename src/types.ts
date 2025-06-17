export type LayoutType = '2pose' | '3pose' | '4pose' | '6pose';

export interface PhotoLayoutProps {
  images: string[];
  frameColor?: string;
}

export interface CountdownTimerProps {
  onComplete: () => void;
  countdownSeconds?: number;
}

export interface PhotoLayout {
  name: string;
  label: string;
  count: number;
} 