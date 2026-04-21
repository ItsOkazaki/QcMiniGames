import { HandData } from '../types';

export class HandPong {
  private ball = { x: 0, y: 0, vx: 0, vy: 0, size: 12 };
  private player = { y: 0, w: 18, h: 120 };
  private ai = { y: 0, w: 18, h: 120 };
  private score: number = 0;
  private onScore: (s: number) => void;
  private canvas: HTMLCanvasElement;
  private lastHit: 'player' | 'ai' | null = null;
  private hitEffect: number = 0;

  constructor(canvas: HTMLCanvasElement, onScore: (s: number) => void) {
    this.canvas = canvas;
    this.onScore = onScore;
    this.resetBall();
    this.player.y = canvas.height / 2 - this.player.h / 2;
    this.ai.y = canvas.height / 2 - this.ai.h / 2;
  }

  private resetBall() {
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
    const speed = 8 + Math.min(10, this.score / 100);
    this.ball.vx = (Math.random() > 0.5 ? 1 : -1) * speed;
    this.ball.vy = (Math.random() - 0.5) * speed;
    this.lastHit = null;
  }

  update(hands: HandData[]) {
    // 1. Move Ball
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    if (this.hitEffect > 0) this.hitEffect -= 0.05;

    // 2. Wall Bounce (Y)
    if (this.ball.y < this.ball.size || this.ball.y > this.canvas.height - this.ball.size) {
      this.ball.vy *= -1;
      this.ball.y = this.ball.y < this.ball.size ? this.ball.size : this.canvas.height - this.ball.size;
    }

    // 3. Player Control
    const activeHand = hands[0];
    if (activeHand) {
      const pos = activeHand.landmarks[9]; // Middle finger base
      const targetY = pos.y * this.canvas.height - this.player.h / 2;
      this.player.y += (targetY - this.player.y) * 0.25;
    }

    // 4. AI Control
    const aiSpeed = 0.08 + Math.min(0.05, this.score / 2000);
    const aiTarget = this.ball.y - this.ai.h / 2;
    this.ai.y += (aiTarget - this.ai.y) * aiSpeed;

    // Bounds
    const limit = (y: number, h: number) => Math.max(0, Math.min(this.canvas.height - h, y));
    this.player.y = limit(this.player.y, this.player.h);
    this.ai.y = limit(this.ai.y, this.ai.h);

    // 5. Paddle Collision
    // Player (Left)
    if (this.ball.vx < 0 && 
        this.ball.x < 60 + this.player.w && 
        this.ball.y > this.player.y - 10 && 
        this.ball.y < this.player.y + this.player.h + 10) {
      
      const relativeIntersectY = (this.player.y + (this.player.h / 2)) - this.ball.y;
      const normalizedIntersectY = relativeIntersectY / (this.player.h / 2);
      const bounceAngle = normalizedIntersectY * (Math.PI / 3);
      
      const speed = Math.hypot(this.ball.vx, this.ball.vy) * 1.05;
      this.ball.vx = speed * Math.cos(bounceAngle);
      this.ball.vy = speed * -Math.sin(bounceAngle);
      
      this.ball.x = 60 + this.player.w + 1;
      this.score += 5;
      this.onScore(this.score);
      this.triggerHit('player');
    }

    // AI (Right)
    const aiX = this.canvas.width - 60 - this.ai.w;
    if (this.ball.vx > 0 && 
        this.ball.x > aiX && 
        this.ball.y > this.ai.y - 10 && 
        this.ball.y < this.ai.y + this.ai.h + 10) {
      
      const relativeIntersectY = (this.ai.y + (this.ai.h / 2)) - this.ball.y;
      const normalizedIntersectY = relativeIntersectY / (this.ai.h / 2);
      const bounceAngle = normalizedIntersectY * (Math.PI / 3);
      
      const speed = Math.hypot(this.ball.vx, this.ball.vy);
      this.ball.vx = -speed * Math.cos(bounceAngle);
      this.ball.vy = speed * -Math.sin(bounceAngle);
      
      this.ball.x = aiX - 1;
      this.triggerHit('ai');
    }

    // 6. Score Points / Reset
    if (this.ball.x < 0) {
      this.score = Math.max(0, this.score - 50);
      this.onScore(this.score);
      this.resetBall();
      this.shake();
    }
    if (this.ball.x > this.canvas.width) {
      this.score += 100;
      this.onScore(this.score);
      this.resetBall();
    }
  }

  private triggerHit(who: 'player' | 'ai') {
    this.lastHit = who;
    this.hitEffect = 1.0;
  }

  private shake() {
    this.canvas.parentElement?.classList.add('animate-shake');
    setTimeout(() => this.canvas.parentElement?.classList.remove('animate-shake'), 500);
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Subtle background pulses
    if (this.hitEffect > 0) {
      ctx.fillStyle = `rgba(249, 115, 22, ${this.hitEffect * 0.1})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Center Line
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.canvas.width / 2, 0);
    ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Player Paddle
    const playerGlow = this.lastHit === 'player' ? this.hitEffect * 30 : 5;
    ctx.shadowBlur = playerGlow;
    ctx.shadowColor = '#f97316';
    ctx.fillStyle = '#f97316';
    ctx.fillRect(60, this.player.y, this.player.w, this.player.h);

    // AI Paddle
    const aiGlow = this.lastHit === 'ai' ? this.hitEffect * 30 : 5;
    ctx.shadowBlur = aiGlow;
    ctx.shadowColor = '#fff';
    ctx.fillStyle = 'white';
    ctx.fillRect(this.canvas.width - 60 - this.ai.w, this.ai.y, this.ai.w, this.ai.h);

    // Ball
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'white';
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.arc(this.ball.x, this.ball.y, this.ball.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    
    // Trail (simple)
    ctx.globalAlpha = 0.3;
    ctx.arc(this.ball.x - this.ball.vx, this.ball.y - this.ball.vy, this.ball.size * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}
