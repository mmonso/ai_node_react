import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';

interface BackgroundCanvasProps {
  color?: string;
  secondaryColor?: string;
}

const BackgroundCanvas: React.FC<BackgroundCanvasProps> = ({
  color = 'var(--primary-bg)',
  secondaryColor = 'var(--accent-color)'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = 50;
    
    // Obter cores reais dos valores CSS
    const getComputedColor = (cssVar: string) => {
      const tempElement = document.createElement('div');
      tempElement.style.color = cssVar;
      document.body.appendChild(tempElement);
      const computedColor = getComputedStyle(tempElement).color;
      document.body.removeChild(tempElement);
      return computedColor;
    };
    
    const primaryColor = getComputedColor(color);
    const accentColor = getComputedColor(secondaryColor);
    
    // Função para converter cores RGB para RGBA com opacidade
    const getRGBA = (color: string, opacity: number) => {
      if (color.startsWith('rgb(')) {
        return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
      }
      return color;
    };
    
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      
      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 5 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.color = Math.random() > 0.5 ? 
          getRGBA(primaryColor, Math.random() * 0.3 + 0.1) : 
          getRGBA(accentColor, Math.random() * 0.3 + 0.1);
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.x < 0 || this.x > canvas!.width) {
          this.speedX = -this.speedX;
        }
        
        if (this.y < 0 || this.y > canvas!.height) {
          this.speedY = -this.speedY;
        }
      }
      
      draw() {
        ctx!.fillStyle = this.color;
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }
    
    const init = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };
    
    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            const opacity = 1 - distance / 150;
            ctx!.strokeStyle = getRGBA(accentColor, opacity * 0.2);
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.stroke();
          }
        }
      }
    };
    
    const resizeCanvas = () => {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      init();
    };
    
    const animate = () => {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      
      drawConnections();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color, secondaryColor]);
  
  return <Canvas ref={canvasRef} />;
};

const Canvas = styled.canvas`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background-color: var(--primary-bg);
  pointer-events: none;
`;

export default BackgroundCanvas; 