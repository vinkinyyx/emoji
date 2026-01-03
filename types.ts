export type EmotionType = 
  | 'Hi' | 'Thanks' | 'Received' | 'Bye' 
  | 'Confused' | 'Happy' | 'Crying' | 'Angry' 
  | 'Fighting' | 'GoodNight' | 'Slacking' | 'Shocked' 
  | 'Awkward' | 'Love' | 'OK' | 'Speechless';

export interface StickerRequest {
  topic: string;
  style: string;
}

export interface StickerPlan {
  id: number;
  emotion: EmotionType;
  visualPrompt: string; // The text prompt for the image generator
  caption: string; // The Chinese text overlay (e.g., "收到")
}

export interface StickerData extends StickerPlan {
  status: 'pending' | 'generating' | 'processing' | 'complete' | 'error';
  rawImageUrl?: string; // Original from API
  processedImageUrl?: string; // Background removed, stroked, resized
  finalBlob?: Blob; // For zip export
}

export interface ProcessingOptions {
  strokeWidth: number;
  strokeColor: string;
}

// Declare global for JSZip/FileSaver loaded via CDN
declare global {
  interface Window {
    JSZip: any;
    saveAs: any;
  }
}