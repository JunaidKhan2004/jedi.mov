"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setTimeout(() => setFallback(true), 0);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 640;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.3, 8.5);

    // Subtle pointer-responsive lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const accentLight = new THREE.PointLight(0xff5f1f, 18, 26);
    accentLight.position.set(3.5, 3, 4);
    scene.add(accentLight);

    const warmLight = new THREE.PointLight(0xffb347, 10, 20);
    warmLight.position.set(-4, -1.5, 3);
    scene.add(warmLight);

    // Foldwork Perspective Grid
    const grid = new THREE.GridHelper(32, 32, 0xff5f1f, 0x353c4a);
    grid.position.y = -2.2;
    const gridMat = grid.material as THREE.Material | THREE.Material[];
    if (Array.isArray(gridMat)) {
      gridMat.forEach((m) => {
        m.transparent = true;
        m.opacity = 0.22;
      });
    } else {
      gridMat.transparent = true;
      gridMat.opacity = 0.22;
    }
    scene.add(grid);

    // Procedural 3D Hero Object (Restrained Glass Prism + Wireframe)
    const prismGroup = new THREE.Group();
    prismGroup.position.set(3.1, 0.4, -1.2);

    const coreGeo = new THREE.IcosahedronGeometry(1.35, 0);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x3b4252,
      metalness: 0.18,
      roughness: 0.16,
      transmission: 0.52,
      transparent: true,
      opacity: 0.84,
      ior: 1.45,
      thickness: 0.8,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    prismGroup.add(coreMesh);

    const wireGeo = new THREE.IcosahedronGeometry(1.52, 0);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xff5f1f,
      wireframe: true,
      transparent: true,
      opacity: 0.30,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    prismGroup.add(wireMesh);

    scene.add(prismGroup);

    // Subtle Floating Particles
    const particleCount = 70;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xa0a8b4,
      size: 0.04,
      transparent: true,
      opacity: 0.45,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const pointer = { x: 0, y: 0 };
    const handlePointerMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    const resizeObserver = new ResizeObserver((entries) => {
      if (!renderer || !entries[0]) return;
      const { width: w, height: h } = entries[0].contentRect;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    let isVisible = true;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible || !renderer) return;

      const elapsed = clock.getElapsedTime();
      prismGroup.rotation.y = elapsed * 0.22 + pointer.x * 0.35;
      prismGroup.rotation.x = Math.sin(elapsed * 0.3) * 0.14 - pointer.y * 0.2;
      wireMesh.rotation.z = -elapsed * 0.12;

      accentLight.position.x = 3.5 + pointer.x * 2.2;
      accentLight.position.y = 3 - pointer.y * 1.8;

      particles.rotation.y = elapsed * 0.025;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", handlePointerMove);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();

      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      grid.geometry.dispose();
      if (Array.isArray(gridMat)) gridMat.forEach((m) => m.dispose());
      else gridMat.dispose();

      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  if (fallback) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="foldwork-perspective-grid absolute inset-x-0 top-1/2 h-[420px] opacity-60" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-85"
    />
  );
}
