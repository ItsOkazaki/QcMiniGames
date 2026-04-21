import { HandData, Point } from '../types';
import confetti from 'canvas-confetti';

interface Fruit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  isCut: boolean;
  type: 'fruit' | 'bomb' | 'golden';
  angle: number;
  rotationSpeed: number;
}

export class BladeMaster {
  private fruits: Fruit[] = [];
  private score: number = 0;
  private onScore: (score: number) => void;
  private canvas: HTMLCanvasElement;
  private trail: Point[] = [];
  private lastBladePos: Point | null = null;
  private comboCount: number = 0;
  private lastCutTime: number = 0;
  private comboTimer: any;

  constructor(canvas: HTMLCanvasElement, onScore: (s: number) => void) {
    this.canvas = canvas;
    this.onScore = onScore;
    this.spawnLoop();
  }

  private spawnLoop() {
    const spawn = () => {
      const count = 1 + Math.floor(this.score / 500); // Spawn more fruits at once as score increases
      for (let i = 0; i < count; i++) {
        this.spawnFruit();
      }
      const nextSpawn = Math.max(400, 1800 - this.score * 2);
      this.spawnTimeout = setTimeout(spawn, nextSpawn);
    };
    this.spawnTimeout = setTimeout(spawn, 1000);
  }

  private spawnTimeout: any;

  private spawnFruit() {
    const isBomb = Math.random() < 0.15;
    const isGolden = !isBomb && Math.random() < 0.05;
    
    this.fruits.push({
      x: 100 + Math.random() * (this.canvas.width - 200),
      y: this.canvas.height + 50,
      vx: (Math.random() - 0.5) * 8,
      vy: -18 - Math.random() * 8,
      size: isGolden ? 25 : (35 + Math.random() * 15),
      color: isBomb ? '#ef4444' : isGolden ? '#fbbf24' : `hsl(${Math.random() * 360}, 70%, 60%)`,
      isCut: false,
      type: isBomb ? 'bomb' : isGolden ? 'golden' : 'fruit',
      angle: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1
    });
  }

  update(hands: HandData[]) {
    const now = Date.now();
    
    // 1. Move fruits
    this.fruits.forEach(f => {
      f.x += f.vx;
      f.y += f.vy;
      f.vy += 0.3; // gravity
      f.angle += f.rotationSpeed;
    });

    // Remove off-screen
    this.fruits = this.fruits.filter(f => f.y < this.canvas.height + 100);

    // 2. Blade Movement
    const activeHand = hands[0];
    if (activeHand) {
      const tip = activeHand.landmarks[8];
      const bladeX = (1 - tip.x) * this.canvas.width;
      const bladeY = tip.y * this.canvas.height;
      const currentPos = { x: bladeX, y: bladeY };

      this.trail.push(currentPos);
      if (this.trail.length > 12) this.trail.shift();

      // Check collision
      if (this.lastBladePos) {
        this.fruits.forEach(f => {
          if (!f.isCut) {
            const dist = Math.hypot(f.x - currentPos.x, f.y - currentPos.y);
            if (dist < f.size + 10) {
              f.isCut = true;
              this.handleCut(f, now);
            }
          }
        });
      }
      this.lastBladePos = currentPos;
    } else {
      this.trail = [];
      this.lastBladePos = null;
      this.comboCount = 0;
    }
  }

  private handleCut(f: Fruit, now: number) {
    if (f.type === 'bomb') {
      this.score = Math.max(0, this.score - 100);
      this.comboCount = 0;
      this.shake();
    } else {
      // Combo logic
      if (now - this.lastCutTime < 500) {
        this.comboCount++;
      } else {
        this.comboCount = 1;
      }
      this.lastCutTime = now;

      const baseScore = f.type === 'golden' ? 100 : 10;
      const comboBonus = Math.min(this.comboCount * 5, 50);
      this.score += baseScore + comboBonus;
      
      this.triggerSplatter(f);
      if (this.comboCount > 2) {
        this.triggerComboEffect();
      }
    }
    this.onScore(this.score);
  }

  private shake() {
    this.canvas.parentElement?.classList.add('animate-shake');
    setTimeout(() => this.canvas.parentElement?.classList.remove('animate-shake'), 500);
  }

  private triggerSplatter(f: Fruit) {
    confetti({
      particleCount: f.type === 'golden' ? 50 : 25,
      spread: 80,
      origin: { x: f.x / this.canvas.width, y: f.y / this.canvas.height },
      colors: [f.color, '#ffffff'],
      ticks: 60,
      gravity: 1.2
    });
  }

  private triggerComboEffect() {
    // Visual flash or something? For now just more confetti
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Draw background gradient (subtle)
    const grad = ctx.createRadialGradient(this.canvas.width/2, this.canvas.height/2, 0, this.canvas.width/2, this.canvas.height/2, this.canvas.width);
    grad.addColorStop(0, 'rgba(234, 88, 12, 0.05)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw fruits
    this.fruits.forEach(f => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle);
      
      if (f.isCut) {
        ctx.fillStyle = f.color;
        // Half 1
        ctx.beginPath();
        ctx.arc(-8, 0, f.size / 2, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
        // Half 2
        ctx.beginPath();
        ctx.arc(8, 0, f.size / 2, Math.PI * 1.5, Math.PI * 0.5);
        ctx.fill();
      } else {
        ctx.shadowBlur = f.type === 'golden' ? 30 : 15;
        ctx.shadowColor = f.color;
        ctx.fillStyle = f.color;
        
        // Fruit body
        ctx.beginPath();
        if (f.type === 'golden') {
          // Polygon for star-like shape?
          this.drawStar(ctx, 0, 0, 5, f.size, f.size/2);
        } else {
          ctx.arc(0, 0, f.size, 0, Math.PI * 2);
        }
        ctx.fill();

        if (f.type === 'bomb') {
          ctx.fillStyle = 'white';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('☢', 0, 8);
        }
      }
      ctx.restore();
    });

    // Draw Blade Trail
    if (this.trail.length > 2) {
      ctx.beginPath();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      
      for (let i = 1; i < this.trail.length; i++) {
        // Quadratic curve for smoother trail
        const xc = (this.trail[i].x + this.trail[i - 1].x) / 2;
        const yc = (this.trail[i].y + this.trail[i - 1].y) / 2;
        ctx.quadraticCurveTo(this.trail[i - 1].x, this.trail[i - 1].y, xc, yc);
      }
      
      ctx.stroke();

      // Combo Text
      if (this.comboCount > 1) {
        const lastPos = this.trail[this.trail.length - 1];
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 24px font-mono';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.comboCount}X COMBO`, lastPos.x, lastPos.y - 40);
      }
    }
  }

  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius)
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y)
      rot += step

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y)
      rot += step
    }
    ctx.lineTo(cx, cy - outerRadius)
    ctx.closePath();
    ctx.fill();
  }

  cleanup() {
    clearTimeout(this.spawnTimeout);
  }
}
