import * as THREE from 'three';
import { HandData } from '../types';

export interface Game {
  id: string;
  name: string;
  description: string;
  render: (ctx: CanvasRenderingContext2D, hands: HandData[]) => void;
  init?: () => void;
  cleanup?: () => void;
}

export interface Game3D extends Game {
  scene?: THREE.Scene;
  camera?: THREE.Camera;
  update: (hands: HandData[], delta: number) => void;
}
