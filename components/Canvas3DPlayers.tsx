"use client";

import { useEffect, useRef, useState } from "react";

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface SkeletonNode {
  name: string;
  pos: Point3D;
}

export function Canvas3DPlayers() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    // Projection settings
    const fov = 400; // perspective depth scale
    const vanishingY = -60; // horizon tilt

    // Ball state
    const ball = {
      x: 0,
      y: 0,
      z: 50,
      vx: 0,
      vz: 0,
      radius: 12,
      rotX: 0,
      rotY: 0,
      owner: 1, // 1 for Player 1, 2 for Player 2, 0 for free ball
    };

    // Player definitions
    // Team 1: Neon Crimson, Team 2: Neon Cyan
    const p1 = {
      x: -60,
      z: 80,
      targetX: -60,
      targetZ: 80,
      color: "#FF4B4B",
      glowColor: "rgba(255, 75, 75, 0.4)",
      runSpeed: 2.8,
      dribbleOffset: { x: 18, z: 12 },
      animCycle: 0,
      kickCooldown: 0,
    };

    const p2 = {
      x: 60,
      z: 120,
      targetX: 60,
      targetZ: 120,
      color: "#60EFFF",
      glowColor: "rgba(96, 239, 255, 0.4)",
      runSpeed: 2.6,
      dribbleOffset: { x: -18, z: -12 },
      animCycle: Math.PI, // offset running phase
      kickCooldown: 0,
    };

    // Projection function from 3D (relative to center of field) to 2D canvas coordinates
    const project = (pt: Point3D) => {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + 30;
      
      // Rotate coordinates slightly around X axis for 3D pitch tilt view
      const pitchAngle = 0.35; // tilt forward
      const cosP = Math.cos(pitchAngle);
      const sinP = Math.sin(pitchAngle);

      // Translate
      const ry = pt.y;
      const rz = pt.z * cosP - pt.y * sinP;
      const rx = pt.x;
      
      // Perspective scale factor
      const scale = fov / (fov + rz);
      
      return {
        x: cx + rx * scale,
        y: cy + (ry + vanishingY) * scale + rz * 0.4, // squashed Z depth
        scale: scale
      };
    };

    // Build joints skeleton for a running player figure
    const getSkeleton = (
      px: number,
      pz: number,
      targetX: number,
      targetZ: number,
      animCycle: number,
      facingBall: boolean,
      ballPos: Point3D
    ): SkeletonNode[] => {
      const height = 90;
      
      // Determine movement direction
      const dx = targetX - px;
      const dz = targetZ - pz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const isMoving = dist > 5;
      
      // Running animation state parameters
      const runCycle = isMoving ? animCycle : 0;
      const speedFactor = isMoving ? Math.min(1.5, dist / 20) : 0;
      
      // Swing angles
      const swingAngle = Math.sin(runCycle) * 0.7 * speedFactor;
      const swingKnee = Math.sin(runCycle - Math.PI / 3) * 0.5 * speedFactor + (speedFactor * 0.3);

      // Determine rotation/facing direction
      let angle = 0;
      if (facingBall) {
        angle = Math.atan2(ballPos.x - px, ballPos.z - pz);
      } else if (isMoving) {
        angle = Math.atan2(dx, dz);
      }

      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);

      // Helper to rotate local joint coordinates to world space
      const localToWorld = (lx: number, ly: number, lz: number): Point3D => {
        // Rotate local x/z based on player angle
        const rx = lx * cosA + lz * sinA;
        const rz = -lx * sinA + lz * cosA;
        return {
          x: px + rx,
          y: -height + ly,
          z: pz + rz
        };
      };

      // Base body joints relative to player root {x:0, y:-height, z:0}
      const joints: SkeletonNode[] = [];
      
      // Hips / Root
      joints.push({ name: "hips", pos: localToWorld(0, height, 0) });
      
      // Spine base / Chest
      const lean = isMoving ? 12 * speedFactor : 2; // lean forward when running
      joints.push({ name: "chest", pos: localToWorld(0, height - 35, -lean) });
      
      // Head
      joints.push({ name: "head", pos: localToWorld(0, height - 55, -lean - 5) });
      
      // Shoulders
      joints.push({ name: "shoulderL", pos: localToWorld(-15, height - 35, -lean) });
      joints.push({ name: "shoulderR", pos: localToWorld(15, height - 35, -lean) });

      // Left arm (swings opposite to left leg)
      const armSwingL = -swingAngle;
      joints.push({ name: "elbowL", pos: localToWorld(-20, height - 20, -lean + Math.sin(armSwingL) * 15) });
      joints.push({ name: "wristL", pos: localToWorld(-22, height - 5, -lean + Math.sin(armSwingL + 0.4) * 20) });

      // Right arm
      const armSwingR = swingAngle;
      joints.push({ name: "elbowR", pos: localToWorld(20, height - 20, -lean + Math.sin(armSwingR) * 15) });
      joints.push({ name: "wristR", pos: localToWorld(22, height - 5, -lean + Math.sin(armSwingR + 0.4) * 20) });

      // Left leg (forward swing when runCycle is in phase)
      const hipL = localToWorld(-10, height, 0);
      const kneeL = localToWorld(-10, height + 20 + Math.sin(swingAngle) * 10, Math.sin(swingAngle) * 18);
      const ankleL = localToWorld(-10, height + 42 + Math.cos(swingAngle) * 5, Math.sin(swingAngle) * 25 + Math.max(0, -swingKnee) * 10);
      joints.push({ name: "hipL", pos: hipL });
      joints.push({ name: "kneeL", pos: kneeL });
      joints.push({ name: "ankleL", pos: ankleL });

      // Right leg
      const hipR = localToWorld(10, height, 0);
      const kneeR = localToWorld(10, height + 20 - Math.sin(swingAngle) * 10, -Math.sin(swingAngle) * 18);
      const ankleR = localToWorld(10, height + 42 - Math.cos(swingAngle) * 5, -Math.sin(swingAngle) * 25 + Math.max(0, swingKnee) * 10);
      joints.push({ name: "hipR", pos: hipR });
      joints.push({ name: "kneeR", pos: kneeR });
      joints.push({ name: "ankleR", pos: ankleR });

      return joints;
    };

    // Draw the structural 3D player bone connector lines
    const drawPlayer = (nodes: SkeletonNode[], color: string, glow: string) => {
      // Projected node coordinates
      const proj: { [key: string]: ReturnType<typeof project> } = {};
      nodes.forEach(n => {
        proj[n.name] = project(n.pos);
      });

      // Joint connectors (bones map)
      const bones = [
        ["hips", "chest"],
        ["chest", "head"],
        ["chest", "shoulderL"],
        ["chest", "shoulderR"],
        // Arms
        ["shoulderL", "elbowL"],
        ["elbowL", "wristL"],
        ["shoulderR", "elbowR"],
        ["elbowR", "wristR"],
        // Legs
        ["hips", "hipL"],
        ["hipL", "kneeL"],
        ["kneeL", "ankleL"],
        ["hips", "hipR"],
        ["hipR", "kneeR"],
        ["kneeR", "ankleR"],
      ];

      // Draw shadow at base
      const hipsProj = proj["hips"];
      const scale = hipsProj.scale;
      
      ctx.beginPath();
      ctx.ellipse(hipsProj.x, hipsProj.y + 40 * scale, 22 * scale, 8 * scale, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.fill();

      // Outer glow line layer
      ctx.strokeStyle = glow;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      bones.forEach(([b1, b2]) => {
        const p1 = proj[b1];
        const p2 = proj[b2];
        if (!p1 || !p2) return;
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineWidth = 10 * scale;
        ctx.stroke();
      });

      // Core crisp neon line layer
      ctx.strokeStyle = color;
      bones.forEach(([b1, b2]) => {
        const p1 = proj[b1];
        const p2 = proj[b2];
        if (!p1 || !p2) return;
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineWidth = 4 * scale;
        ctx.stroke();
      });

      // Draw head sphere
      const head = proj["head"];
      ctx.beginPath();
      ctx.arc(head.x, head.y, 9 * head.scale, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    };

    // Draw perspective green pitch grid
    const drawPitch = () => {
      ctx.strokeStyle = "rgba(0, 255, 135, 0.08)";
      ctx.lineWidth = 1.5;

      const pitchWidth = 360;
      const pitchLength = 260;

      // Vertical lines running along length (X direction grid)
      for (let x = -pitchWidth; x <= pitchWidth; x += 40) {
        ctx.beginPath();
        const start = project({ x, y: 0, z: -pitchLength / 2 });
        const end = project({ x, y: 0, z: pitchLength / 2 });
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }

      // Horizontal lines running across width (Z direction grid)
      for (let z = -pitchLength / 2; z <= pitchLength / 2; z += 30) {
        ctx.beginPath();
        const start = project({ x: -pitchWidth, y: 0, z });
        const end = project({ x: pitchWidth, y: 0, z });
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }

      // Center Circle projected outline
      ctx.strokeStyle = "rgba(0, 255, 135, 0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const numSegs = 32;
      const circleRadius = 55;
      for (let i = 0; i <= numSegs; i++) {
        const theta = (i * Math.PI * 2) / numSegs;
        const pt = project({
          x: Math.cos(theta) * circleRadius,
          y: 0,
          z: Math.sin(theta) * circleRadius
        });
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      ctx.stroke();

      // Goalpost box markers (Red Team Box left, Blue Team Box right)
      ctx.strokeStyle = "rgba(0, 255, 135, 0.12)";
      ctx.beginPath();
      // Left penalty box
      const boxLeft1 = project({ x: -pitchWidth, y: 0, z: -80 });
      const boxLeft2 = project({ x: -pitchWidth + 80, y: 0, z: -80 });
      const boxLeft3 = project({ x: -pitchWidth + 80, y: 0, z: 80 });
      const boxLeft4 = project({ x: -pitchWidth, y: 0, z: 80 });
      ctx.moveTo(boxLeft1.x, boxLeft1.y);
      ctx.lineTo(boxLeft2.x, boxLeft2.y);
      ctx.lineTo(boxLeft3.x, boxLeft3.y);
      ctx.lineTo(boxLeft4.x, boxLeft4.y);
      
      // Right penalty box
      const boxRight1 = project({ x: pitchWidth, y: 0, z: -80 });
      const boxRight2 = project({ x: pitchWidth - 80, y: 0, z: -80 });
      const boxRight3 = project({ x: pitchWidth - 80, y: 0, z: 80 });
      const boxRight4 = project({ x: pitchWidth, y: 0, z: 80 });
      ctx.moveTo(boxRight1.x, boxRight1.y);
      ctx.lineTo(boxRight2.x, boxRight2.y);
      ctx.lineTo(boxRight3.x, boxRight3.y);
      ctx.lineTo(boxRight4.x, boxRight4.y);
      ctx.stroke();
    };

    // Update simulation positions and interactions
    const updatePositions = () => {
      time += 0.016; // increment animation timer

      // Cooldown decrement
      if (p1.kickCooldown > 0) p1.kickCooldown--;
      if (p2.kickCooldown > 0) p2.kickCooldown--;

      // Check if mouse interaction is active
      const targetPos1 = { x: p1.targetX, z: p1.targetZ };
      const targetPos2 = { x: p2.targetX, z: p2.targetZ };

      if (mouseRef.current.active && canvas) {
        // Project mouse position onto 3D field coordinates
        // Simple mapping: scale from canvas coordinate space
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        
        const cx = canvas.width / 2;
        const cy = canvas.height / 2 + 30;

        // Approximate map 2D coordinates back to field coordinate system
        const projectedMouseX = (mx - cx) * 1.3;
        const projectedMouseZ = (my - cy) * 1.8 + 80;

        // Player holding the ball steers towards the mouse cursor
        if (ball.owner === 1) {
          p1.targetX = Math.max(-300, Math.min(300, projectedMouseX));
          p1.targetZ = Math.max(-120, Math.min(120, projectedMouseZ));
        } else if (ball.owner === 2) {
          p2.targetX = Math.max(-300, Math.min(300, projectedMouseX));
          p2.targetZ = Math.max(-120, Math.min(120, projectedMouseZ));
        } else {
          // Free ball, both race towards it
          p1.targetX = ball.x;
          p1.targetZ = ball.z;
          p2.targetX = ball.x;
          p2.targetZ = ball.z;
        }
      } else {
        // AI Patrol / Auto Dribble Play Loop
        // Player 1 carries towards Player 2 zone, Player 2 intercepts
        if (ball.owner === 1) {
          p1.targetX = 140 + Math.sin(time) * 40;
          p1.targetZ = 20 + Math.cos(time * 0.7) * 40;
          
          // Player 2 runs to tackle
          p2.targetX = p1.x + 10;
          p2.targetZ = p1.z + 10;
        } else if (ball.owner === 2) {
          p2.targetX = -140 + Math.sin(time) * 40;
          p2.targetZ = -20 + Math.cos(time * 0.7) * 40;
          
          // Player 1 runs to tackle
          p1.targetX = p2.x - 10;
          p1.targetZ = p2.z - 10;
        } else {
          // Both chase the free rolling ball
          p1.targetX = ball.x;
          p1.targetZ = ball.z;
          p2.targetX = ball.x;
          p2.targetZ = ball.z;
        }
      }

      // Move Player 1
      const dx1 = p1.targetX - p1.x;
      const dz1 = p1.targetZ - p1.z;
      const dist1 = Math.sqrt(dx1 * dx1 + dz1 * dz1);
      if (dist1 > 4) {
        p1.x += (dx1 / dist1) * p1.runSpeed;
        p1.z += (dz1 / dist1) * p1.runSpeed;
        p1.animCycle += 0.22; // advance running gait
      }

      // Move Player 2
      const dx2 = p2.targetX - p2.x;
      const dz2 = p2.targetZ - p2.z;
      const dist2 = Math.sqrt(dx2 * dx2 + dz2 * dz2);
      if (dist2 > 4) {
        p2.x += (dx2 / dist2) * p2.runSpeed;
        p2.z += (dz2 / dist2) * p2.runSpeed;
        p2.animCycle += 0.22; // advance running gait
      }

      // Match ball position to dribbler if owned
      if (ball.owner === 1) {
        // Dribble position is slightly in front of Player 1
        const runAngle = Math.atan2(dx1, dz1);
        const bx = p1.x + Math.sin(runAngle) * 14 + Math.sin(time * 8) * 3;
        const bz = p1.z + Math.cos(runAngle) * 14 + Math.cos(time * 8) * 3;
        
        ball.x += (bx - ball.x) * 0.45;
        ball.z += (bz - ball.z) * 0.45;
        
        // Spin ball based on velocity
        ball.rotY += 0.12;

        // Auto pass / tackle logic
        const distToDefender = Math.sqrt((p1.x - p2.x) ** 2 + (p1.z - p2.z) ** 2);
        if (distToDefender < 35 && p2.kickCooldown === 0) {
          // Random tackle success or pass release
          if (Math.random() < 0.08) {
            ball.owner = 2;
            p2.kickCooldown = 20; // prevent instant retake
          } else if (Math.random() < 0.04) {
            // Kick ball away
            ball.owner = 0;
            ball.vx = (p2.x - p1.x) * 0.25 + (Math.random() - 0.5) * 4;
            ball.vz = (p2.z - p1.z) * 0.25 + (Math.random() - 0.5) * 4;
            p1.kickCooldown = 30;
          }
        }
      } else if (ball.owner === 2) {
        // Dribble position in front of Player 2
        const runAngle = Math.atan2(dx2, dz2);
        const bx = p2.x + Math.sin(runAngle) * 14 + Math.sin(time * 8) * 3;
        const bz = p2.z + Math.cos(runAngle) * 14 + Math.cos(time * 8) * 3;
        
        ball.x += (bx - ball.x) * 0.45;
        ball.z += (bz - ball.z) * 0.45;
        
        ball.rotY += 0.12;

        const distToDefender = Math.sqrt((p2.x - p1.x) ** 2 + (p2.z - p1.z) ** 2);
        if (distToDefender < 35 && p1.kickCooldown === 0) {
          if (Math.random() < 0.08) {
            ball.owner = 1;
            p1.kickCooldown = 20;
          } else if (Math.random() < 0.04) {
            ball.owner = 0;
            ball.vx = (p1.x - p2.x) * 0.25 + (Math.random() - 0.5) * 4;
            ball.vz = (p1.z - p2.z) * 0.25 + (Math.random() - 0.5) * 4;
            p2.kickCooldown = 30;
          }
        }
      } else {
        // Physics for free rolling ball
        ball.x += ball.vx;
        ball.z += ball.vz;
        
        // Decelerate friction
        ball.vx *= 0.94;
        ball.vz *= 0.94;

        // Bounce off field boundaries
        if (Math.abs(ball.x) > 310) {
          ball.vx *= -0.7;
          ball.x = Math.sign(ball.x) * 310;
        }
        if (Math.abs(ball.z) > 130) {
          ball.vz *= -0.7;
          ball.z = Math.sign(ball.z) * 130;
        }

        // Check who picks it up
        const d1 = Math.sqrt((p1.x - ball.x) ** 2 + (p1.z - ball.z) ** 2);
        const d2 = Math.sqrt((p2.x - ball.x) ** 2 + (p2.z - ball.z) ** 2);

        if (d1 < 20 && p1.kickCooldown === 0) {
          ball.owner = 1;
        } else if (d2 < 20 && p2.kickCooldown === 0) {
          ball.owner = 2;
        }
      }
    };

    // Draw the football (glowing white sphere with rotation pattern)
    const drawBall = () => {
      const projBall = project({ x: ball.x, y: 0, z: ball.z });
      const scale = projBall.scale;
      const radius = ball.radius * scale;

      // Ball shadow
      ctx.beginPath();
      ctx.ellipse(projBall.x, projBall.y + 4, radius, radius * 0.35, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fill();

      // Ball core sphere
      ctx.beginPath();
      ctx.arc(projBall.x, projBall.y, radius, 0, Math.PI * 2);
      
      const grad = ctx.createRadialGradient(
        projBall.x - radius * 0.3,
        projBall.y - radius * 0.3,
        radius * 0.1,
        projBall.x,
        projBall.y,
        radius
      );
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.4, "#e0e0e0");
      grad.addColorStop(0.8, "#909090");
      grad.addColorStop(1, "#202020");
      ctx.fillStyle = grad;
      ctx.shadowColor = "rgba(255,255,255,0.3)";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // Draw simple football seam lines spinning
      ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
      ctx.lineWidth = 1.2 * scale;
      
      // Draw 3 horizontal lines across sphere representing seams
      const spinAngle = ball.rotY;
      for (let i = -1; i <= 1; i += 0.7) {
        ctx.beginPath();
        const startAngle = Math.asin(i);
        const endAngle = Math.PI - startAngle;
        
        // draw arc approximation
        for (let t = 0; t <= 10; t++) {
          const u = t / 10;
          const theta = startAngle + (endAngle - startAngle) * u;
          const sx = projBall.x + Math.cos(theta + spinAngle) * radius * Math.cos(startAngle);
          const sy = projBall.y + i * radius * 0.6; // perspective projection flat
          
          if (t === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }
    };

    // Main animation loop
    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw grid / pitch
      drawPitch();

      // 2. Compute physics / movement
      updatePositions();

      // 3. Build joint coordinates
      const nodes1 = getSkeleton(p1.x, p1.z, p1.targetX, p1.targetZ, p1.animCycle, ball.owner !== 1, { x: ball.x, y: 0, z: ball.z });
      const nodes2 = getSkeleton(p2.x, p2.z, p2.targetX, p2.targetZ, p2.animCycle, ball.owner !== 2, { x: ball.x, y: 0, z: ball.z });

      // 4. Render depth-sorted elements (Players & Ball)
      const renderables = [
        { type: "player", z: p1.z, draw: () => drawPlayer(nodes1, p1.color, p1.glowColor) },
        { type: "player", z: p2.z, draw: () => drawPlayer(nodes2, p2.color, p2.glowColor) },
        { type: "ball", z: ball.z, draw: () => drawBall() }
      ];

      renderables.sort((a, b) => b.z - a.z); // render back-to-front

      renderables.forEach(r => r.draw());

      animationId = requestAnimationFrame(render);
    };

    // Resize handler
    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = Math.max(300, Math.min(420, parent.clientWidth * 0.65));
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    render();

    // Mouse listeners
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseEnter = () => {
      mouseRef.current.active = true;
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      setIsHovered(false);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseenter", handleMouseEnter);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    // Touch support for mobile responsiveness
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.touches[0].clientX - rect.left;
      mouseRef.current.y = e.touches[0].clientY - rect.top;
      e.preventDefault(); // prevent scrolling while playing
    };

    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchstart", handleMouseEnter);
    canvas.addEventListener("touchend", handleMouseLeave);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseenter", handleMouseEnter);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchstart", handleMouseEnter);
      canvas.removeEventListener("touchend", handleMouseLeave);
    };
  }, []);

  return (
    <div className="relative w-full rounded-2xl glass-panel border-cyan-blue/15 bg-gradient-to-b from-[#0e1627]/60 to-[#060c18]/80 p-4 shadow-[0_0_30px_rgba(0,255,135,0.02)] overflow-hidden">
      
      {/* Decorative tech grid backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,135,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,135,0.015)_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] pointer-events-none" />

      {/* Grid Header Info */}
      <div className="relative z-20 flex items-center justify-between border-b border-cyan-blue/10 pb-2 mb-3 text-[10px] tracking-wider uppercase font-heading text-gray-muted">
        <span className="flex items-center gap-1.5 text-[#00FF87] text-glow-green">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00FF87] animate-ping" />
          Interactive 3D Practice Pitch
        </span>
        <span className="text-[9px] font-mono text-cyan-blue tracking-normal">
          {isHovered ? "Control: Hovering Active" : "Status: Auto-dribble mode"}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full bg-transparent rounded-lg cursor-crosshair transition-opacity duration-300"
      />

      <div className="text-[10px] text-center text-gray-muted mt-2 tracking-wide font-heading uppercase">
        Move your cursor or swipe over the field to guide the ball carrier!
      </div>
    </div>
  );
}
