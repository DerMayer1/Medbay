"use client";

import { useEffect, useRef } from "react";

export function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    class Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedY = Math.random() * 1 + 0.5; // Falling down
        this.speedX = (Math.random() - 0.5) * 0.5; // Slight horizontal drift
        this.opacity = Math.random() * 0.5 + 0.1;
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;

        // Reset if it goes out of bounds
        if (this.y > canvas!.height) {
          this.y = 0;
          this.x = Math.random() * canvas!.width;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(240, 161, 93, ${this.opacity})`; // Orange tone matches #f0a15d
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const initParticles = () => {
      particles = [];
      const numberOfParticles = Math.floor((canvas.width * canvas.height) / 10000); // Responsive amount
      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    resize();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-60"
    />
  );
}
