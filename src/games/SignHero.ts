import { HandData } from '../types';
import confetti from 'canvas-confetti';

type GestureType = 'OPEN' | 'FIST' | 'POINT' | 'PEACE' | 'THUMBS_UP';

interface Target {
  type: GestureType;
  x: number;
  y: number;
  timer: number;
  maxTimer: number;
}

export class SignHero {
  private targets: Target[] = [];
  private score: number = 0;
  private onScore: (s: number) => void;
  private canvas: HTMLCanvasElement;
  private spawnedCount = 0;
  private lastMatchTime = 0;
  private streak = 0;

  constructor(canvas: HTMLCanvasElement, onScore: (s: number) => void) {
    this.canvas = canvas;
    this.onScore = onScore;
    this.spawnTarget();
  }

  private spawnTarget() {
    const types: GestureType[] = ['OPEN', 'FIST', 'POINT', 'PEACE', 'THUMBS_UP'];
    const maxT = Math.max(1000, 3000 - this.spawnedCount * 30);
    this.targets.push({
      type: types[Math.floor(Math.random() * types.length)],
      x: 100 + Math.random() * (this.canvas.width - 200),
      y: 100 + Math.random() * (this.canvas.height - 200),
      timer: maxT,
      maxTimer: maxT
    });
    this.spawnedCount++;
    this.spawnTimeout = setTimeout(() => this.spawnTarget(), Math.max(800, 2000 - this.spawnedCount * 20));
  }

  private spawnTimeout: any;

  private detectGesture(hand: HandData): GestureType {
    const landmarks = hand.landmarks;
    
    const isExtended = (fingerIndex: number) => {
      const tip = landmarks[fingerIndex * 4 + 4];
      const pip = landmarks[fingerIndex * 4 + 2];
      const wrist = landmarks[0];
      
      const distTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
      const distPip = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
      return distTip > distPip * 1.1; // Added threshold for stability
    };

    const thumb = isExtended(0);
    const index = isExtended(1);
    const middle = isExtended(2);
    const ring = isExtended(3);
    const pinky = isExtended(4);

    const count = [index, middle, ring, pinky].filter(Boolean).length;

    if (count === 4) return 'OPEN';
    if (count === 0 && !thumb) return 'FIST';
    if (count === 1 && index) return 'POINT';
    if (count === 2 && index && middle) return 'PEACE';
    if (thumb && count <= 1) return 'THUMBS_UP';
    
    return 'FIST';
  }

  update(hands: HandData[]) {
    const now = Date.now();
    const activeHand = hands[0];
    if (!activeHand) {
      this.streak = 0;
      return;
    }

    const currentGesture = this.detectGesture(activeHand);
    const wrist = activeHand.landmarks[0];
    const handX = (1 - wrist.x) * this.canvas.width;
    const handY = wrist.y * this.canvas.height;

    // Check collision with targets
    const initialTargetsCount = this.targets.length;
    this.targets = this.targets.filter(t => {
      t.timer -= 16;
      if (t.timer <= 0) {
        this.streak = 0;
        return false;
      }

      const dist = Math.hypot(t.x - handX, t.y - handY);
      if (dist < 120 && currentGesture === t.type) {
        this.score += 25 + (this.streak * 5);
        this.streak++;
        this.lastMatchTime = now;
        this.onScore(this.score);
        this.triggerEffect(t);
        return false;
      }
      return true;
    });
  }

  private triggerEffect(t: Target) {
    confetti({
      particleCount: 25,
      origin: { x: t.x / this.canvas.width, y: t.y / this.canvas.height },
      colors: ['#f97316', '#ffffff', '#fbbf24']
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.targets.forEach(t => {
      const progress = t.timer / t.maxTimer;
      ctx.save();
      
      // Shadow
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(249, 115, 22, 0.3)';
      
      // Outer Circle
      ctx.beginPath();
      ctx.strokeStyle = `rgba(249, 115, 22, ${0.2 + progress * 0.8})`;
      ctx.lineWidth = 6;
      ctx.arc(t.x, t.y, 80, -Math.PI/2, (-Math.PI/2) + (Math.PI * 2 * progress));
      ctx.stroke();

      // Icon/Text Container
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.arc(t.x, t.y, 70, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px font-mono';
      ctx.textAlign = 'center';
      ctx.fillText(t.type, t.x, t.y + 35);
      
      const labelDesc = {
        'OPEN': '✋ PAPER',
        'FIST': '✊ ROCK',
        'POINT': '☝️ POINT',
        'PEACE': '✌️ PEACE',
        'THUMBS_UP': '👍 LIKE'
      }[t.type];
      
      ctx.font = '48px Arial';
      ctx.fillText(labelDesc.split(' ')[0], t.x, t.y - 5);
      ctx.restore();
    });

    if (this.streak > 1) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 20px font-mono';
      ctx.textAlign = 'center';
      ctx.fillText(`STREAK: ${this.streak}X`, this.canvas.width/2, 100);
    }
  }

  cleanup() {
    clearTimeout(this.spawnTimeout);
  }
}
