import { EmotionType } from "./types";

export const EMOTIONS: EmotionType[] = [
  'Hi', 'Thanks', 'Received', 'Bye',
  'Confused', 'Happy', 'Crying', 'Angry',
  'Fighting', 'GoodNight', 'Slacking', 'Shocked',
  'Awkward', 'Love', 'OK', 'Speechless'
];

export const EMOTION_LABELS: Record<EmotionType, string> = {
  Hi: '你好',
  Thanks: '谢谢',
  Received: '收到',
  Bye: '再见',
  Confused: '疑惑',
  Happy: '开心',
  Crying: '大哭',
  Angry: '生气',
  Fighting: '加油',
  GoodNight: '晚安',
  Slacking: '摸鱼',
  Shocked: '震惊',
  Awkward: '尴尬',
  Love: '比心',
  OK: '好的',
  Speechless: '无语'
};

// Standard WeChat sizes
export const STICKER_SIZE = 240;
export const THUMB_SIZE = 120;
export const MAX_FILE_SIZE_KB = 100;
