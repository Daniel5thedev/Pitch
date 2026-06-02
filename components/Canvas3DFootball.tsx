"use client";

import { useEffect, useRef, useState } from "react";

// Generate vertices of a Truncated Icosahedron (Soccer Ball geometry)
// 60 vertices, 32 faces (12 pentagons, 20 hexagons)
interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Face {
  indices: number[];
  isPentagon: boolean;
}

export function Canvas3DFootball({ size = 320 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    
    // Golden ratio for icosahedron vertices
    const phi = (1 + Math.sqrt(5)) / 2;
    
    // Base vertices of truncated icosahedron
    const rawVertices: Point3D[] = [];
    const scale = size * (110 / 320); // Ball radius in pixels

    // Coordinates are cyclic permutations of:
    // (0, +/-1, +/-3phi)
    // (+/-1, +/- (2+phi), +/- 2phi)
    // (+/- phi, +/- 2, +/- (2phi + 1))
    const addPermutations = (x: number, y: number, z: number) => {
      const unique = new Set<string>();
      const add = (px: number, py: number, pz: number) => {
        const key = `${px.toFixed(4)},${py.toFixed(4)},${pz.toFixed(4)}`;
        if (!unique.has(key)) {
          unique.add(key);
          rawVertices.push({ x: px, y: py, z: pz });
        }
      };
      
      const signs = [1, -1];
      for (const sx of signs) {
        for (const sy of signs) {
          for (const sz of signs) {
            add(x * sx, y * sy, z * sz);
            add(y * sx, z * sy, x * sz);
            add(z * sx, x * sy, y * sz);
          }
        }
      }
    };

    // Construct the 60 vertices
    addPermutations(0, 1, 3 * phi);
    addPermutations(2, 1 + 2 * phi, phi);
    addPermutations(1, 2 + phi, 2 * phi);

    // Normalize vertices to lie exactly on a sphere of radius 'scale'
    const vertices = rawVertices.map(v => {
      const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
      return {
        x: (v.x / len) * scale,
        y: (v.y / len) * scale,
        z: (v.z / len) * scale
      };
    });

    // Generate 32 faces based on distances between vertices
    // A pentagon has 5 vertices, a hexagon has 6.
    const faces: Face[] = [];
    
    // To generate the faces, we find close groups of 5 and 6 vertices
    // Pentagons occur around the 12 original vertices of the icosahedron.
    // Hexagons fill the gaps.
    // Let's create an approximation of panel drawing on a sphere for canvas:
    // Draw 32 circular panels on the sphere, depth sorted.
    // This is mathematically simpler and renders with extremely smooth gradients!
    const numPanels = 32;
    const panelDirections: Point3D[] = [];
    
    // Use Fibonacci sphere algorithm to distribute 32 panels evenly on a sphere
    for (let index = 0; index < numPanels; index += 1) {
      const y = 1 - (index / (numPanels - 1)) * 2; // y goes from 1 to -1
      const radius = Math.sqrt(1 - y * y); // radius at y
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const theta = goldenAngle * index; // golden angle increment
      
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      panelDirections.push({ x, y, z });
    }

    // Rotational states
    let angleX = 0.006;
    let angleY = 0.008;
    let mouseX = 0;
    let mouseY = 0;
    
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = event.clientX - rect.left - rect.width / 2;
      mouseY = event.clientY - rect.top - rect.height / 2;
      
      // Dynamic rotation based on cursor
      angleY = mouseX * 0.0001;
      angleX = -mouseY * 0.0001;
    };

    if (size >= 60) {
      canvas.addEventListener("mousemove", handleMouseMove);
    }

    // Main animation loop
    const render = () => {
      // Clear canvas with deep green-black transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // 3D Rotation matrices applied
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      // Rotate panel directions in-place to accumulate spin
      for (const dir of panelDirections) {
        // Rotate Y
        const x1 = dir.x * cosY - dir.z * sinY;
        const z1 = dir.x * sinY + dir.z * cosY;
        // Rotate X
        const y2 = dir.y * cosX - z1 * sinX;
        const z2 = dir.y * sinX + z1 * cosX;
        
        dir.x = x1;
        dir.y = y2;
        dir.z = z2;
      }

      // Draw sphere shadow (only for larger sizes)
      if (size >= 60) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy + 25 * (size / 320), scale - 10 * (size / 320), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.filter = `blur(${18 * (size / 320)}px)`;
        ctx.fill();
        ctx.restore();
      }

      // Draw base solid sphere
      const baseGrad = ctx.createRadialGradient(
        cx - 30 * (size / 320), 
        cy - 30 * (size / 320), 
        20 * (size / 320), 
        cx, 
        cy, 
        scale
      );
      baseGrad.addColorStop(0, "#ffffff");
      baseGrad.addColorStop(0.3, "#e2e8f0");
      baseGrad.addColorStop(0.8, "#64748b");
      baseGrad.addColorStop(1, "#0c130e");

      ctx.beginPath();
      ctx.arc(cx, cy, scale, 0, Math.PI * 2);
      ctx.fillStyle = baseGrad;
      ctx.fill();

      // Sort panels by Z-depth (Z-buffer back-to-front rendering)
      const sortedPanels = panelDirections
        .map((dir, idx) => ({ dir, idx }))
        .sort((a, b) => a.dir.z - b.dir.z);

      // Draw the panel patterns
      for (const item of sortedPanels) {
        const { dir, idx } = item;
        
        // Skip back-facing panels (only draw front hemisphere)
        if (dir.z < -0.15) continue;

        // Project 3D center to 2D
        const px = cx + dir.x * scale;
        const py = cy + dir.y * scale;
        
        // Panel radius based on depth perspective
        const panelRadius = 26 * (size / 320) * (1 + dir.z * 0.4);

        // Every 3rd panel is a black pentagon, others are white hexagons
        const isPentagon = idx % 3 === 0;

        ctx.beginPath();
        
        // Draw hexagonal / pentagonal shape approximation
        const numSides = isPentagon ? 5 : 6;
        // Face rotation angles depending on sphere spin
        const baseAngle = Math.atan2(dir.y, dir.x);
        
        for (let side = 0; side < numSides; side += 1) {
          const faceAngle = baseAngle + (side * (Math.PI * 2)) / numSides;
          
          // Project polygon vertices using isometric sphere projection
          const sx = px + Math.cos(faceAngle) * panelRadius;
          const sy = py + Math.sin(faceAngle) * panelRadius * (1 - Math.abs(dir.y) * 0.25);
          
          if (side === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();

        // Shading depending on light source (top-left)
        // Cosine of angle with light vector (e.g. [-0.5, -0.5, 0.7])
        const lightAlign = (dir.x * -0.5 + dir.y * -0.5 + dir.z * 0.7);
        const intensity = Math.max(0.1, Math.min(1.0, lightAlign));

        if (isPentagon) {
          // Cyber Black / Neon Green pentagon
          const r = Math.round(0 + intensity * 20);
          const g = Math.round(50 + intensity * 205); // High neon green
          const b = Math.round(15 + intensity * 40);
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.strokeStyle = "rgba(4, 28, 12, 0.4)";
          ctx.lineWidth = Math.max(0.5, 1.5 * (size / 320));
        } else {
          // White/Silver hexagon
          const gray = Math.round(180 + intensity * 75);
          ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
          ctx.strokeStyle = "rgba(4, 28, 12, 0.3)";
          ctx.lineWidth = Math.max(0.5, 2.0 * (size / 320));
        }

        ctx.fill();
        ctx.stroke();
      }

      // Draw shiny overlay layer (glowing highlight sphere)
      const shineGrad = ctx.createRadialGradient(
        cx - 40 * (size / 320), 
        cy - 40 * (size / 320), 
        10 * (size / 320), 
        cx, 
        cy, 
        scale
      );
      shineGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
      shineGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.1)");
      shineGrad.addColorStop(0.8, "rgba(0, 0, 0, 0)");
      shineGrad.addColorStop(1, "rgba(0, 0, 0, 0.65)");

      ctx.beginPath();
      ctx.arc(cx, cy, scale, 0, Math.PI * 2);
      ctx.fillStyle = shineGrad;
      ctx.fill();

      // Outer green athletic aura glow (only for larger sizes)
      if (size >= 60) {
        const auraGrad = ctx.createRadialGradient(cx, cy, scale - 5, cx, cy, scale + 25);
        auraGrad.addColorStop(0, "rgba(0, 255, 135, 0)");
        auraGrad.addColorStop(0.5, "rgba(0, 255, 135, 0.08)");
        auraGrad.addColorStop(1, "rgba(0, 255, 135, 0)");

        ctx.beginPath();
        ctx.arc(cx, cy, scale + 25, 0, Math.PI * 2);
        ctx.fillStyle = auraGrad;
        ctx.fill();
      }

      // Slowly decelerate default rotation if not hovered
      if (!isHovered) {
        angleY += (0.003 - angleY) * 0.05;
        angleX += (0.002 - angleX) * 0.05;
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (size >= 60) {
        canvas.removeEventListener("mousemove", handleMouseMove);
      }
      cancelAnimationFrame(animationId);
    };
  }, [isHovered, size]);

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      {/* Glow pulse layer */}
      {size >= 60 && (
        <div 
          className="absolute rounded-full bg-[#00FF87] opacity-[0.06] blur-[60px] animate-pulse" 
          style={{ width: `${size * 0.9}px`, height: `${size * 0.9}px` }}
        />
      )}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="relative z-10 transition-transform duration-500 hover:scale-105"
      />
    </div>
  );
}
