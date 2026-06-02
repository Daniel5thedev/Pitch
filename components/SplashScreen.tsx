"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { Play } from "lucide-react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visible, setVisible] = useState(true);
  const [showSkip, setShowSkip] = useState(false);
  const [fadeStarted, setFadeStarted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    // Check session storage first so we don't annoy returning users
    const hasPlayed = sessionStorage.getItem("kahawa-splash-played");
    if (hasPlayed) {
      setVisible(false);
      onComplete();
      return;
    }

    // Show skip button after a short delay
    const skipTimer = setTimeout(() => setShowSkip(true), 800);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle resizing to full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let animationId: number;
    let startTime = Date.now();

    // Soccer ball geometry (simplified for high-performance rendering on full screen)
    const numPanels = 24;
    const panels: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < numPanels; i++) {
      const y = 1 - (i / (numPanels - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = i * Math.PI * (3 - Math.sqrt(5));
      panels.push({
        x: Math.cos(theta) * r,
        y: y,
        z: Math.sin(theta) * r,
      });
    }

    // Physics / Trajectory state variables
    // Kicking starts from bottom-left (15% X, 85% Y) to Center (50% X, 50% Y)
    // Trajectory is a beautiful 3D oval/parabolic bezier arc
    const startX = window.innerWidth * 0.1;
    const startY = window.innerHeight * 0.85;
    const endX = window.innerWidth * 0.5;
    const endY = window.innerHeight * 0.5;
    
    // Control point to create a curved, oval-shaped parabolic path
    const ctrlX = window.innerWidth * 0.25;
    const ctrlY = window.innerHeight * 0.15;

    // Shockwave particles on impact
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }[] = [];

    // Ball angles for 3D rotation
    let angleX = 0;
    let angleY = 0;

    // Shake offset
    let shakeX = 0;
    let shakeY = 0;

    const render = () => {
      const elapsed = (Date.now() - startTime) / 1000; // seconds

      // Background clear: deep green/black pitch atmosphere with spotlights
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let bgAlpha = 1.0;
      if (elapsed > 1.8) {
        // fade background from 1.0 to 0.0 between 1.8s and 2.6s
        bgAlpha = Math.max(0, 1.0 - (elapsed - 1.8) / 0.8);
        if (elapsed > 1.8 && !fadeStarted) {
          setFadeStarted(true);
        }
      }
      ctx.fillStyle = `rgba(4, 14, 6, ${bgAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw stadium grid and spotlight glow in background
      ctx.strokeStyle = `rgba(0, 255, 135, ${0.03 * bgAlpha})`;
      ctx.lineWidth = 1;
      const grid = 50;
      for (let x = 0; x < canvas.width; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Dynamic Spotlights
      const spotGrad1 = ctx.createRadialGradient(0, 0, 10, 0, 0, canvas.width * 0.6);
      spotGrad1.addColorStop(0, `rgba(96, 239, 255, ${0.12 * bgAlpha})`);
      spotGrad1.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = spotGrad1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(canvas.width * 0.55, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();

      const spotGrad2 = ctx.createRadialGradient(canvas.width, 0, 10, canvas.width, 0, canvas.width * 0.6);
      spotGrad2.addColorStop(0, `rgba(0, 255, 135, ${0.12 * bgAlpha})`);
      spotGrad2.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = spotGrad2;
      ctx.beginPath();
      ctx.moveTo(canvas.width, 0);
      ctx.lineTo(canvas.width * 0.45, canvas.height);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Phase 1: Player silhouette kicking (0.0s to 0.7s)
      if (elapsed < 0.8) {
        ctx.save();
        ctx.translate(startX, startY);
        
        // Draw futuristic kicker wireframe foot / leg swinging
        const swingAngle = Math.max(-0.6, 0.8 - elapsed * 3); // Swings forward
        ctx.rotate(swingAngle);

        // Kicker Neon Leg Shadow
        ctx.shadowColor = "#00FF87";
        ctx.shadowBlur = 15;

        // Draw Player Leg
        ctx.beginPath();
        ctx.moveTo(-60, -120);
        ctx.quadraticCurveTo(-30, -100, -10, -40); // Thigh to knee
        ctx.lineTo(15, 30); // Knee to ankle
        ctx.lineTo(45, 25); // Ankle to toe
        ctx.lineTo(35, 45); // Sole
        ctx.lineTo(10, 35); // Heel
        ctx.closePath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#00FF87";
        ctx.stroke();

        // Shoe details
        ctx.fillStyle = "rgba(0, 255, 135, 0.2)";
        ctx.fill();

        ctx.restore();
      }

      // Trajectory Phase: Kick (starts at 0.5s)
      // Ball travel takes 1.5 seconds (0.5s to 2.0s)
      const kickDuration = 1.3;
      const kickDelay = 0.5;
      
      let ballX = startX;
      let ballY = startY;
      let ballZ = 0; // Simulated depth (0 far, 1 close)
      let ballScale = 12; // Radius in pixels
      let ballAlpha = 1;

      if (elapsed > kickDelay) {
        const t = Math.min(1, (elapsed - kickDelay) / kickDuration);

        // Quadratic Bezier path curve formula: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
        const mt = 1 - t;
        ballX = mt * mt * startX + 2 * mt * t * ctrlX + t * t * endX;
        ballY = mt * mt * startY + 2 * mt * t * ctrlY + t * t * endY;
        
        // Depth perspective (ball grows exponentially as it hits screen)
        ballZ = t; // goes from 0 to 1
        ballScale = 12 + Math.pow(t, 2.5) * 160; // radius from 12px up to 172px

        // Rotate ball rapidly while in flight
        angleX += 0.08 * (1 + t * 2);
        angleY += 0.11 * (1 + t * 2);

        // Draw trajectory neon green wind trail
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        // Draw the curved trail up to current ball position
        for (let i = 0.05; i <= t; i += 0.05) {
          const mi = 1 - i;
          const tx = mi * mi * startX + 2 * mi * i * ctrlX + i * i * endX;
          const ty = mi * mi * startY + 2 * mi * i * ctrlY + i * i * endY;
          ctx.lineTo(tx, ty);
        }
        ctx.strokeStyle = "rgba(0, 255, 135, 0.4)";
        ctx.lineWidth = 1 + t * 12;
        ctx.shadowColor = "#00FF87";
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();

        // Draw neon trail particles
        if (t < 0.98 && Math.random() < 0.4) {
          particles.push({
            x: ballX + (Math.random() - 0.5) * ballScale * 0.5,
            y: ballY + (Math.random() - 0.5) * ballScale * 0.5,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: 2 + Math.random() * 4,
            alpha: 0.8,
            color: Math.random() > 0.5 ? "#00FF87" : "#60EFFF",
          });
        }
      }

      // Draw active wind/glowing trail particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.restore();
        }
      }

      // Impact Shockwave Event! (occurs at elapsed = kickDelay + kickDuration = 1.8s)
      const impactTime = kickDelay + kickDuration;
      let impactElapsed = elapsed - impactTime;

      if (impactElapsed > 0 && impactElapsed < 1.8) {
        // Impact! Calculate screen shake
        const shakeMagnitude = Math.max(0, 18 - impactElapsed * 12);
        shakeX = (Math.random() - 0.5) * shakeMagnitude;
        shakeY = (Math.random() - 0.5) * shakeMagnitude;

        // Apply screen shake translate to canvas
        ctx.save();
        ctx.translate(shakeX, shakeY);

        // Spawn neon green/blue shockwave particles on impact
        if (impactElapsed < 0.1 && particles.length < 80) {
          for (let j = 0; j < 80; j++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 16;
            particles.push({
              x: endX,
              y: endY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              size: 2 + Math.random() * 6,
              alpha: 1.0,
              color: Math.random() > 0.4 ? "#00FF87" : "#60EFFF",
            });
          }
        }

        // Draw radial shockwave rings expanding outwards
        const ringRadius = impactElapsed * 900;
        ctx.save();
        ctx.beginPath();
        ctx.arc(endX, endY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 135, ${Math.max(0, 1 - impactElapsed * 0.85)})`;
        ctx.lineWidth = 12 / (1 + impactElapsed * 5);
        ctx.shadowColor = "#00FF87";
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.restore();

        const cyanRingRadius = impactElapsed * 1200;
        ctx.save();
        ctx.beginPath();
        ctx.arc(endX, endY, cyanRingRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(96, 239, 255, ${Math.max(0, 0.7 - impactElapsed * 0.75)})`;
        ctx.lineWidth = 6 / (1 + impactElapsed * 5);
        ctx.shadowColor = "#60EFFF";
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.restore();

        // Title and subtext fade-in
        const textAlpha = Math.min(1.0, impactElapsed * 1.5);
        ctx.save();
        ctx.globalAlpha = textAlpha;
        ctx.textAlign = "center";
        
        // Neon title shadow glow
        ctx.shadowColor = "#00FF87";
        ctx.shadowBlur = 25;

        // Draw Title "KAHAWA SPORT ARENA" responsive
        const titleSize = Math.max(32, Math.min(72, window.innerWidth * 0.08));
        ctx.font = `bold ${titleSize}px Rajdhani, sans-serif`;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText("KAHAWA SPORT ARENA", endX, endY - 15);
        
        // Draw Subtitle
        ctx.shadowColor = "#60EFFF";
        ctx.shadowBlur = 15;
        const subSize = Math.max(12, Math.min(20, window.innerWidth * 0.025));
        ctx.font = `600 ${subSize}px Rajdhani, sans-serif`;
        ctx.fillStyle = "#60EFFF";
        ctx.fillText("L I V E   B O O K I N G   &   S P O R T S", endX, endY + 30);
        
        ctx.restore();

        ctx.restore(); // end screen shake save
      }

      // Ball zoom out / shrink phase (starts at 2.6s and lasts 0.8s)
      const zoomOutTime = impactTime + 0.8;
      if (elapsed > zoomOutTime) {
        const zoomT = Math.min(1, (elapsed - zoomOutTime) / 0.8);
        
        // Smooth easeInOutQuad easing for ball movement
        const easeT = zoomT < 0.5 ? 2 * zoomT * zoomT : 1 - Math.pow(-2 * zoomT + 2, 2) / 2;
        
        // Target positioning on Featured Pro badge on homepage
        let targetX = endX;
        let targetY = endY;
        let targetSize = 10;
        
        const targetEl = document.getElementById("featured-pro-ball-target");
        if (targetEl) {
          const rect = targetEl.getBoundingClientRect();
          targetX = rect.left + rect.width / 2;
          targetY = rect.top + rect.height / 2;
          targetSize = Math.max(8, rect.width / 2);
        }
        
        // Ball coordinates & scale interpolations
        ballX = endX + (targetX - endX) * easeT;
        ballY = endY + (targetY - endY) * easeT;
        ballScale = 172 + (targetSize - 172) * easeT;
        
        // Smooth alpha fade at the absolute end (last 5%) to blend perfectly
        ballAlpha = 1.0;
        if (zoomT > 0.95) {
          ballAlpha = Math.max(0, (1 - zoomT) / 0.05);
        }
        
        // Title logo stays centered but slowly scales up slightly
        ctx.save();
        ctx.textAlign = "center";
        const titleSize = Math.max(32, Math.min(72, window.innerWidth * 0.08));
        ctx.font = `bold ${titleSize + zoomT * 8}px Rajdhani, sans-serif`;
        ctx.fillStyle = `rgba(255, 255, 255, ${1 - zoomT})`;
        ctx.fillText("KAHAWA SPORT ARENA", endX, endY - 15);

        const subSize = Math.max(12, Math.min(20, window.innerWidth * 0.025));
        ctx.font = `600 ${subSize}px Rajdhani, sans-serif`;
        ctx.fillStyle = `rgba(96, 239, 255, ${1 - zoomT})`;
        ctx.fillText("L I V E   B O O K I N G   &   S P O R T S", endX, endY + 30);
        ctx.restore();

        // Complete the animation at 3.5s!
        if (elapsed > zoomOutTime + 0.8) {
          sessionStorage.setItem("kahawa-splash-played", "true");
          setVisible(false);
          onComplete();
          return;
        }
      }

      // Render the 3D rotating soccer ball (only while visible)
      if (elapsed > kickDelay && ballAlpha > 0 && ballScale > 2) {
        ctx.save();
        ctx.globalAlpha = ballAlpha;

        // Apply 3D rotation matrix
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);

        const rotatedPanels = panels.map((p) => {
          // Rotate Y
          const x1 = p.x * cosY - p.z * sinY;
          const z1 = p.x * sinY + p.z * cosY;
          // Rotate X
          const y2 = p.y * cosX - z1 * sinX;
          const z2 = p.y * sinX + z1 * cosX;

          return { x: x1, y: y2, z: z2 };
        });

        // Draw shadow under the ball (projected back onto field)
        if (ballZ < 0.9) {
          ctx.beginPath();
          ctx.arc(ballX, ballY + 35 * (1 - ballZ), ballScale - 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * (1 - ballZ)})`;
          ctx.filter = "blur(8px)";
          ctx.fill();
          ctx.filter = "none";
        }

        // Draw base sphere gradient
        const ballGrad = ctx.createRadialGradient(
          ballX - ballScale * 0.25,
          ballY - ballScale * 0.25,
          ballScale * 0.15,
          ballX,
          ballY,
          ballScale
        );
        ballGrad.addColorStop(0, "#ffffff");
        ballGrad.addColorStop(0.3, "#e2e8f0");
        ballGrad.addColorStop(0.8, "#475569");
        ballGrad.addColorStop(1, "#0f172a");

        ctx.beginPath();
        ctx.arc(ballX, ballY, ballScale, 0, Math.PI * 2);
        ctx.fillStyle = ballGrad;
        ctx.fill();

        // Sort panels back to front
        const sortedPanels = rotatedPanels
          .map((p, idx) => ({ p, idx }))
          .sort((a, b) => a.p.z - b.p.z);

        // Draw panels
        for (const item of sortedPanels) {
          const { p, idx } = item;
          if (p.z < -0.1) continue; // cull back faces

          const px = ballX + p.x * ballScale;
          const py = ballY + p.y * ballScale;
          
          const panelRad = (ballScale * 0.24) * (1 + p.z * 0.45);
          const isPent = idx % 3 === 0;

          ctx.beginPath();
          const sides = isPent ? 5 : 6;
          const baseAngle = Math.atan2(p.y, p.x);
          
          for (let s = 0; s < sides; s++) {
            const sideAngle = baseAngle + (s * Math.PI * 2) / sides;
            const sx = px + Math.cos(sideAngle) * panelRad;
            const sy = py + Math.sin(sideAngle) * panelRad * (1 - Math.abs(p.y) * 0.2);
            
            if (s === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.closePath();

          // Lighting vector alignment
          const lightIntensity = Math.max(0.1, Math.min(1.0, (p.x * -0.3 + p.y * -0.3 + p.z * 0.9)));

          if (isPent) {
            const greenVal = Math.round(70 + lightIntensity * 185);
            ctx.fillStyle = `rgb(0, ${greenVal}, 60)`;
            ctx.strokeStyle = "rgba(4, 30, 10, 0.4)";
            ctx.lineWidth = Math.max(0.8, ballScale * 0.015);
          } else {
            const grayVal = Math.round(160 + lightIntensity * 95);
            ctx.fillStyle = `rgb(${grayVal}, ${grayVal}, ${grayVal})`;
            ctx.strokeStyle = "rgba(4, 30, 10, 0.3)";
            ctx.lineWidth = Math.max(1.0, ballScale * 0.02);
          }
          ctx.fill();
          ctx.stroke();
        }

        // Overlay shine layer
        const shineGrad = ctx.createRadialGradient(
          ballX - ballScale * 0.35,
          ballY - ballScale * 0.35,
          ballScale * 0.1,
          ballX,
          ballY,
          ballScale
        );
        shineGrad.addColorStop(0, "rgba(255, 255, 255, 0.5)");
        shineGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.1)");
        shineGrad.addColorStop(0.8, "rgba(0,0,0,0)");
        shineGrad.addColorStop(1, "rgba(0,0,0,0.6)");

        ctx.beginPath();
        ctx.arc(ballX, ballY, ballScale, 0, Math.PI * 2);
        ctx.fillStyle = shineGrad;
        ctx.fill();

        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationId);
      clearTimeout(skipTimer);
    };
  }, [onComplete]);

  const handleSkip = () => {
    sessionStorage.setItem("kahawa-splash-played", "true");
    setVisible(false);
    onComplete();
  };

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-[99999] bg-transparent overflow-hidden select-none ${fadeStarted ? "pointer-events-none" : "pointer-events-auto"}`}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full block" />
      {showSkip && (
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 z-10 px-4 py-2 flex items-center gap-1.5 rounded-full bg-black/40 hover:bg-black/70 border border-[#00FF87]/20 text-[#00FF87] hover:text-[#60EFFF] text-xs font-heading font-extrabold uppercase tracking-widest transition active:scale-95 shadow-[0_0_15px_rgba(0,255,135,0.1)] pointer-events-auto"
        >
          Skip Intro
          <Play className="h-3 w-3 fill-current" />
        </button>
      )}
    </div>
  );
}
