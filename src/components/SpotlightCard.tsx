"use client";

import React, { useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  enableTilt?: boolean;
}

export function SpotlightCard({
  children,
  className = "",
  enableTilt = false,
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCoords({ x, y });

    if (enableTilt && !prefersReducedMotion) {
      const ry = ((x - 50) / 50) * 4;
      const rx = ((50 - y) / 50) * 4;
      setTilt({ rx, ry });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rx: 0, ry: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform:
          enableTilt && !prefersReducedMotion
            ? `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
            : undefined,
        transition: isHovered
          ? "transform 0.12s ease-out, border-color 0.2s ease"
          : "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease",
      }}
      className={`relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] ${className}`}
    >
      {/* Pointer-responsive specular spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(420px circle at ${coords.x}% ${coords.y}%, var(--spotlight), transparent 70%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
