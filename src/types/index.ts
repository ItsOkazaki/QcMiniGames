export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface HandData {
  landmarks: Point[];
  worldLandmarks: Point[];
  handedness: 'Left' | 'Right';
  score: number;
}

export type GameState = 'playing' | 'paused' | 'gameover' | 'menu';

export interface GameMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
}
