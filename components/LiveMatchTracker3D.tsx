"use client";

import { useEffect, useRef } from "react";

interface LiveMatchTracker3DProps {
  matchState: {
    homeTeam: string;
    awayTeam: string;
    scoreHome: number;
    scoreAway: number;
    timer: number;
    currentEvent: string;
    phase: "ATTACK_HOME" | "ATTACK_AWAY" | "MIDFIELD" | "GOAL_SCORING" | "CORNER" | "KICKOFF";
  };
}

export function LiveMatchTracker3D({ matchState }: LiveMatchTracker3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let ball = { x: 0, y: 0, z: 0, targetX: 0, targetY: 0, targetZ: 0, speed: 0.08 };
    
    // Grid sizes in isometric coordinates (field range: -100 to 100 in X, -60 to 60 in Y)
    const fieldWidth = 160;
    const fieldHeight = 100;
    
    // Particle arrays
    const players: { team: "home" | "away"; x: number; y: number; bx: number; by: number }[] = [];
    const particles: { x: number; y: number; z: number; vx: number; vy: number; vz: number; size: number; alpha: number; color: string }[] = [];

    // Initialize player nodes
    const teamColors = { home: "#00FF87", away: "#60EFFF" };
    // Home team (Left side)
    players.push({ team: "home", x: -70, y: 0, bx: -70, by: 0 }); // GK
    players.push({ team: "home", x: -40, y: -25, bx: -40, by: -25 }); // DF
    players.push({ team: "home", x: -40, y: 25, bx: -40, by: 25 }); // DF
    players.push({ team: "home", x: -15, y: -15, bx: -15, by: -15 }); // MF
    players.push({ team: "home", x: -15, y: 15, bx: -15, by: 15 }); // MF
    players.push({ team: "home", x: 10, y: 0, bx: 10, by: 0 }); // FW

    // Away team (Right side)
    players.push({ team: "away", x: 70, y: 0, bx: 70, by: 0 }); // GK
    players.push({ team: "away", x: 40, y: -25, bx: 40, by: -25 }); // DF
    players.push({ team: "away", x: 40, y: 25, bx: 40, by: 25 }); // DF
    players.push({ team: "away", x: 15, y: -15, bx: 15, by: -15 }); // MF
    players.push({ team: "away", x: 15, y: 15, bx: 15, by: 15 }); // MF
    players.push({ team: "away", x: -10, y: 0, bx: -10, by: 0 }); // FW

    // Set isometric projection parameters
    // Center of canvas is the 3D origin
    const isoAngle = Math.PI / 6; // 30 degrees
    const cosIso = Math.cos(isoAngle);
    const sinIso = Math.sin(isoAngle);

    const project = (x: number, y: number, z: number) => {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + 10;
      
      // Isometric projection formula
      const screenX = cx + (x - y) * cosIso;
      const screenY = cy + (x + y) * sinIso - z;
      return { x: screenX, y: screenY };
    };

    // Respond to phase changes by setting ball targets and player offsets
    const updateGameLogic = () => {
      const { phase } = matchState;

      // Reset player offsets
      for (const p of players) {
        p.x = p.bx + (Math.random() - 0.5) * 8;
        p.y = p.by + (Math.random() - 0.5) * 8;
      }

      if (phase === "KICKOFF" || phase === "MIDFIELD") {
        ball.targetX = (Math.random() - 0.5) * 30;
        ball.targetY = (Math.random() - 0.5) * 40;
        ball.targetZ = 0;
      } else if (phase === "ATTACK_HOME") {
        // Home attacking away goal (Right side)
        ball.targetX = 40 + Math.random() * 30;
        ball.targetY = (Math.random() - 0.5) * 35;
        ball.targetZ = 0;
        // Shift forwards up
        players[5].x = 35;
        players[11].x = 20; // Away DF retreat
      } else if (phase === "ATTACK_AWAY") {
        // Away attacking home goal (Left side)
        ball.targetX = -40 - Math.random() * 30;
        ball.targetY = (Math.random() - 0.5) * 35;
        ball.targetZ = 0;
        players[11].x = -35;
        players[5].x = -20;
      } else if (phase === "GOAL_SCORING") {
        const shootHome = Math.random() > 0.5;
        ball.targetX = shootHome ? 81 : -81; // hitting net
        ball.targetY = (Math.random() - 0.5) * 12; // inside post
        ball.targetZ = 2 + Math.random() * 8; // in the air
        
        // Spawn particle bursts
        for (let i = 0; i < 25; i++) {
          particles.push({
            x: ball.targetX,
            y: ball.targetY,
            z: ball.targetZ,
            vx: (Math.random() - 0.5) * 5 - (shootHome ? 2 : -2),
            vy: (Math.random() - 0.5) * 5,
            vz: Math.random() * 4,
            size: 2 + Math.random() * 3,
            alpha: 1.0,
            color: shootHome ? teamColors.home : teamColors.away,
          });
        }
      } else if (phase === "CORNER") {
        const topCorner = Math.random() > 0.5;
        ball.targetX = Math.random() > 0.5 ? 78 : -78;
        ball.targetY = topCorner ? -48 : 48;
        ball.targetZ = 0;
      }
    };

    // Run game logic on startup and when phase changes
    updateGameLogic();

    let lastPhase = matchState.phase;

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Check for phase change
      if (matchState.phase !== lastPhase) {
        lastPhase = matchState.phase;
        updateGameLogic();
      }

      // Smooth ball physics interpolation
      ball.x += (ball.targetX - ball.x) * ball.speed;
      ball.y += (ball.targetY - ball.y) * ball.speed;
      // Parabolic arc for Z-axis (height bounce during passes)
      const dist = Math.sqrt(Math.pow(ball.targetX - ball.x, 2) + Math.pow(ball.targetY - ball.y, 2));
      if (dist > 5) {
        ball.z = Math.sin((1 - Math.min(1, dist / 80)) * Math.PI) * 15;
      } else {
        ball.z += (ball.targetZ - ball.z) * ball.speed;
      }

      // Draw 3D grass field shadow border
      const corners = [
        project(-fieldWidth / 2, -fieldHeight / 2, 0),
        project(fieldWidth / 2, -fieldHeight / 2, 0),
        project(fieldWidth / 2, fieldHeight / 2, 0),
        project(-fieldWidth / 2, fieldHeight / 2, 0),
      ];

      // Draw Field Base
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      ctx.lineTo(corners[1].x, corners[1].y);
      ctx.lineTo(corners[2].x, corners[2].y);
      ctx.lineTo(corners[3].x, corners[3].y);
      ctx.closePath();
      
      // Grass gradient matching active theme
      const isLightTheme = document.documentElement.getAttribute("data-theme") === "light";
      const fieldGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      if (isLightTheme) {
        fieldGrad.addColorStop(0, "rgba(224, 242, 230, 0.95)");
        fieldGrad.addColorStop(1, "rgba(200, 230, 210, 0.95)");
      } else {
        fieldGrad.addColorStop(0, "rgba(10, 32, 18, 0.8)");
        fieldGrad.addColorStop(1, "rgba(4, 18, 10, 0.9)");
      }
      
      ctx.fillStyle = fieldGrad;
      ctx.shadowColor = isLightTheme ? "rgba(0,0,0,0.06)" : "rgba(0, 255, 135, 0.05)";
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Field Lines (White neon style)
      ctx.strokeStyle = isLightTheme ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 255, 135, 0.15)";
      ctx.lineWidth = 1.5;
      
      // Border outline
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      ctx.lineTo(corners[1].x, corners[1].y);
      ctx.lineTo(corners[2].x, corners[2].y);
      ctx.lineTo(corners[3].x, corners[3].y);
      ctx.closePath();
      ctx.stroke();

      // Center line
      const mid1 = project(0, -fieldHeight / 2, 0);
      const mid2 = project(0, fieldHeight / 2, 0);
      ctx.beginPath();
      ctx.moveTo(mid1.x, mid1.y);
      ctx.lineTo(mid2.x, mid2.y);
      ctx.stroke();

      // Center circle
      ctx.beginPath();
      const center = project(0, 0, 0);
      // Approximate 3D isometric circle with ellipse
      ctx.ellipse(center.x, center.y, 24 * cosIso, 24 * sinIso, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Penalty box Left
      const penL1 = project(-fieldWidth / 2, -22, 0);
      const penL2 = project(-fieldWidth / 2 + 22, -22, 0);
      const penL3 = project(-fieldWidth / 2 + 22, 22, 0);
      const penL4 = project(-fieldWidth / 2, 22, 0);
      ctx.beginPath();
      ctx.moveTo(penL1.x, penL1.y);
      ctx.lineTo(penL2.x, penL2.y);
      ctx.lineTo(penL3.x, penL3.y);
      ctx.lineTo(penL4.x, penL4.y);
      ctx.stroke();

      // Penalty box Right
      const penR1 = project(fieldWidth / 2, -22, 0);
      const penR2 = project(fieldWidth / 2 - 22, -22, 0);
      const penR3 = project(fieldWidth / 2 - 22, 22, 0);
      const penR4 = project(fieldWidth / 2, 22, 0);
      ctx.beginPath();
      ctx.moveTo(penR1.x, penR1.y);
      ctx.lineTo(penR2.x, penR2.y);
      ctx.lineTo(penR3.x, penR3.y);
      ctx.lineTo(penR4.x, penR4.y);
      ctx.stroke();

      // Draw Goal posts (3D structural frames)
      const drawGoal = (x: number, teamColor: string) => {
        const topY = -12;
        const botY = 12;
        const height = 12;
        
        const pt1 = project(x, topY, 0);
        const pt2 = project(x, botY, 0);
        const pt1H = project(x, topY, height);
        const pt2H = project(x, botY, height);

        ctx.strokeStyle = isLightTheme ? "#4A5D4E" : "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Posts and crossbar
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt1H.x, pt1H.y);
        ctx.lineTo(pt2H.x, pt2H.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.stroke();

        // Net netting
        ctx.strokeStyle = isLightTheme ? "rgba(74, 93, 78, 0.25)" : "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 0.8;
        const ptNetBack = project(x + (x > 0 ? 5 : -5), topY, 0);
        const ptNetBackH = project(x + (x > 0 ? 5 : -5), topY, height);
        const ptNetBack2 = project(x + (x > 0 ? 5 : -5), botY, 0);
        const ptNetBack2H = project(x + (x > 0 ? 5 : -5), botY, height);

        ctx.beginPath();
        ctx.moveTo(pt1H.x, pt1H.y);
        ctx.lineTo(ptNetBackH.x, ptNetBackH.y);
        ctx.lineTo(ptNetBack2H.x, ptNetBack2H.y);
        ctx.lineTo(pt2H.x, pt2H.y);
        ctx.moveTo(ptNetBackH.x, ptNetBackH.y);
        ctx.lineTo(ptNetBack.x, ptNetBack.y);
        ctx.moveTo(ptNetBack2H.x, ptNetBack2H.y);
        ctx.lineTo(ptNetBack2.x, ptNetBack2.y);
        ctx.stroke();
      };
      
      drawGoal(-fieldWidth / 2, teamColors.home);
      drawGoal(fieldWidth / 2, teamColors.away);

      // Render players nodes (isometric sorted depth Y-major)
      const sortedPlayers = [...players].sort((a, b) => a.y - b.y);
      for (const p of sortedPlayers) {
        const pt = project(p.x, p.y, 0);
        const pColor = teamColors[p.team];

        // Draw dynamic node glow shadow
        ctx.beginPath();
        ctx.ellipse(pt.x, pt.y + 1, 4 * cosIso, 2 * sinIso, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
        ctx.fill();

        // Node vector circle
        ctx.beginPath();
        ctx.arc(pt.x, pt.y - 3, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = pColor;
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();

        // Outer glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y - 3, 7, 0, Math.PI * 2);
        ctx.strokeStyle = pColor;
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // Draw Ball shadow
      const ballShadowPt = project(ball.x, ball.y, 0);
      ctx.beginPath();
      ctx.ellipse(ballShadowPt.x, ballShadowPt.y, Math.max(1, 3.5 - ball.z * 0.1) * cosIso, Math.max(0.5, 1.8 - ball.z * 0.05) * sinIso, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.1, 0.45 - ball.z * 0.02)})`;
      ctx.fill();

      // Draw Ball (glowing neon sphere in 3D projection height)
      const ballPt = project(ball.x, ball.y, ball.z);
      ctx.save();
      
      const ballGlow = ctx.createRadialGradient(
        ballPt.x - 1,
        ballPt.y - 1,
        1,
        ballPt.x,
        ballPt.y,
        4.5
      );
      ballGlow.addColorStop(0, "#FFFFFF");
      ballGlow.addColorStop(0.3, "#FFFFDD");
      ballGlow.addColorStop(1, "#FF6B2C"); // Neon orange core ball

      ctx.beginPath();
      ctx.arc(ballPt.x, ballPt.y - 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = ballGlow;
      ctx.shadowColor = "#FF6B2C";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();

      // Render score and particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * 0.2;
        p.y += p.vy * 0.2;
        p.z += p.vz * 0.2;
        p.vz -= 0.1; // gravity
        p.alpha -= 0.035;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
        } else {
          const pt = project(p.x, p.y, p.z);
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          ctx.restore();
        }
      }

      // Direct Event Announcement Text
      if (matchState.currentEvent) {
        ctx.save();
        ctx.textAlign = "center";
        
        // Render stylized event box
        const textY = 22;
        ctx.font = "bold 13px Rajdhani, sans-serif";
        const widthText = ctx.measureText(matchState.currentEvent).width + 24;

        ctx.fillStyle = isLightTheme ? "rgba(255,255,255,0.9)" : "rgba(13, 29, 18, 0.85)";
        ctx.strokeStyle = isLightTheme ? "rgba(0, 200, 100, 0.3)" : "rgba(0, 255, 135, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(canvas.width / 2 - widthText / 2, textY - 14, widthText, 22, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isLightTheme ? "#008B45" : "#00FF87";
        ctx.fillText(matchState.currentEvent, canvas.width / 2, textY);
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [matchState]);

  return (
    <div className="relative w-full h-44 rounded-2xl overflow-hidden glass-panel border border-cyan-blue/15 flex items-center justify-center">
      {/* 3D Field Canvas */}
      <canvas
        ref={canvasRef}
        width={340}
        height={176}
        className="w-[340px] h-[176px] block z-10"
      />
      
      {/* Dynamic backdrop grid */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 pointer-events-none" />
    </div>
  );
}
