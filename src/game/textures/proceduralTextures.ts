import * as THREE from 'three';

class ProceduralTextureManager {
  private cache = new Map<string, THREE.CanvasTexture>();

  public getAsphaltStreet(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
    return this.getOrCreate('asphalt_street', renderer, (ctx, width, height) => {
      // Dark asphalt base
      ctx.fillStyle = '#1e242c';
      ctx.fillRect(0, 0, width, height);

      // Fine asphalt aggregate noise
      for (let i = 0; i < 3500; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const brightness = Math.floor(40 + Math.random() * 45);
        ctx.fillStyle = `rgb(${brightness},${brightness + 2},${brightness + 5})`;
        ctx.fillRect(x, y, 2, 2);
      }

      // Yellow dashed center road markings
      ctx.fillStyle = '#f59e0b';
      const stripeW = 8;
      const stripeH = 48;
      const gap = 32;
      for (let y = 0; y < height; y += stripeH + gap) {
        ctx.fillRect(width / 2 - stripeW / 2, y, stripeW, stripeH);
      }

      // White boundary curb lines
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(12, 0, 4, height);
      ctx.fillRect(width - 16, 0, 4, height);
    });
  }

  public getConcrete(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
    return this.getOrCreate('concrete', renderer, (ctx, width, height) => {
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 3000; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const gray = Math.floor(65 + Math.random() * 35);
        ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
        ctx.fillRect(x, y, 2, 2);
      }

      // Subtle concrete seam lines & expansion joints
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, width, height);
      ctx.strokeRect(width / 2, 0, width / 2, height);
    });
  }

  public getSandstone(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
    return this.getOrCreate('sandstone', renderer, (ctx, width, height) => {
      ctx.fillStyle = '#b08968';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 3500; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.fillStyle = Math.random() > 0.5 ? '#ddb892' : '#7f5539';
        ctx.fillRect(x, y, 2, 2);
      }

      ctx.strokeStyle = 'rgba(88, 47, 14, 0.4)';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, width, height);
      // Adobe horizontal brick courses
      for (let y = 64; y < height; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    });
  }

  public getMetalContainer(renderer: THREE.WebGLRenderer, baseColor = '#e63946'): THREE.CanvasTexture {
    return this.getOrCreate(`container_${baseColor}`, renderer, (ctx, width, height) => {
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, width, height);

      // Corrugated vertical 3D depth shadows
      const stripeW = width / 16;
      for (let i = 0; i < 16; i++) {
        const x = i * stripeW;
        const gradient = ctx.createLinearGradient(x, 0, x + stripeW, 0);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.25)');
        gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, 0, stripeW, height);
      }

      // Tactical Shipping Stencil
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('SECTOR-09 // TACTICAL', 16, 40);

      // Corner rivets
      ctx.fillStyle = '#1e293b';
      for (let y = 16; y < height; y += 48) {
        ctx.beginPath();
        ctx.arc(8, y, 3.5, 0, Math.PI * 2);
        ctx.arc(width - 8, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  public getWoodCrate(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
    return this.getOrCreate('wood_crate', renderer, (ctx, width, height) => {
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(0, 0, width, height);

      const plankH = height / 4;
      for (let i = 0; i < 4; i++) {
        const y = i * plankH;
        ctx.strokeStyle = '#3b210c';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, y, width, plankH);
      }

      ctx.strokeStyle = '#5a2e0e';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(10, 10);
      ctx.lineTo(width - 10, height - 10);
      ctx.moveTo(width - 10, 10);
      ctx.lineTo(10, height - 10);
      ctx.stroke();

      ctx.strokeStyle = '#3b210c';
      ctx.lineWidth = 18;
      ctx.strokeRect(0, 0, width, height);

      // Military stencil
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('AMMO SUP-24', 40, height / 2 + 6);
    });
  }

  public getMilitaryHazard(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
    return this.getOrCreate('military_hazard', renderer, (ctx, width, height) => {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#0f172a';
      const stripeW = 28;
      for (let x = -height; x < width + height; x += stripeW * 2) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + stripeW, 0);
        ctx.lineTo(x + stripeW - height, height);
        ctx.lineTo(x - height, height);
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      ctx.strokeRect(0, 0, width, height);
    });
  }

  public getCyberNeonSign(renderer: THREE.WebGLRenderer, text: string, color = '#38bdf8'): THREE.CanvasTexture {
    return this.getOrCreate(`neon_${text}_${color}`, renderer, (ctx, width, height) => {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Outer glowing neon border
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      // Neon Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, width / 2, height / 2);

      // Glow overlay
      ctx.fillStyle = color;
      ctx.fillText(text, width / 2, height / 2);
    });
  }

  public getJumpPadTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
    return this.getOrCreate('jump_pad', renderer, (ctx, width, height) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Outer ring
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, 90, 0, Math.PI * 2);
      ctx.stroke();

      // Glowing cyan inner chevrons pointing up
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';

      for (const offsetY of [-35, 5, 45]) {
        ctx.beginPath();
        ctx.moveTo(cx - 45, cy + offsetY + 25);
        ctx.lineTo(cx, cy + offsetY);
        ctx.lineTo(cx + 45, cy + offsetY + 25);
        ctx.stroke();
      }
    });
  }

  public getCarbonFiber(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
    return this.getOrCreate('carbon_fiber', renderer, (ctx, width, height) => {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, width, height);

      const size = 16;
      for (let x = 0; x < width; x += size) {
        for (let y = 0; y < height; y += size) {
          if ((x / size + y / size) % 2 === 0) {
            ctx.fillStyle = '#1f2937';
            ctx.fillRect(x, y, size, size);
          }
        }
      }
    });
  }

  public getGridFloor(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
    return this.getOrCreate('grid_floor', renderer, (ctx, width, height) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      const halfW = width / 2;
      const halfH = height / 2;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, halfW, halfH);
      ctx.fillRect(halfW, halfH, halfW, halfH);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(0, 0, width, height);
    });
  }

  public getTargetBullseye(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
    return this.getOrCreate('bullseye', renderer, (ctx, width, height) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const rings = [
        { r: width * 0.45, color: '#0f172a' },
        { r: width * 0.35, color: '#2563eb' },
        { r: width * 0.25, color: '#ef4444' },
        { r: width * 0.15, color: '#f59e0b' },
        { r: width * 0.05, color: '#dc2626' },
      ];

      for (const ring of rings) {
        ctx.fillStyle = ring.color;
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  private getOrCreate(
    key: string,
    renderer: THREE.WebGLRenderer,
    drawFn: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
  ): THREE.CanvasTexture {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    drawFn(ctx, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    if (renderer) {
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    }

    this.cache.set(key, texture);
    return texture;
  }
}

export const textures = new ProceduralTextureManager();
