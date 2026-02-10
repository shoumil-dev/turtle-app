"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const SPRITE_TYPES = ["/heart_sprite.png", "/star_sprite.png"] as const;
const COUNT = 14; // 6–14 total, using 10 for balance
const BASE_SIZE = 36;
const MIN_SCALE = 0.6;
const MAX_SCALE = 1.2;
const MIN_OPACITY = 0.5;
const MAX_OPACITY = 0.85;
const MIN_SPEED = 12;
const MAX_SPEED = 38;
const MIN_DEPTH = 0.5;
const MAX_DEPTH = 1.4;
const WOBBLE_AMPLITUDE = 4;
const WOBBLE_SPEED = 0.8;
const ROTATION_SPEED = 0.15; // degrees per frame, very gentle

type SpriteState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  opacity: number;
  depth: number;
  phase: number;
  phase2: number;
  src: (typeof SPRITE_TYPES)[number];
  size: number; // BASE_SIZE * scale, for bounce math
};

function createSprites(): SpriteState[] {
  if (typeof window === "undefined") return [];
  const w = window.innerWidth;
  const h = window.innerHeight;
  const sprites: SpriteState[] = [];
  for (let i = 0; i < COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
    const depth = MIN_DEPTH + Math.random() * (MAX_DEPTH - MIN_DEPTH);
    const scale = MIN_SCALE + Math.random() * (MAX_SCALE - MIN_SCALE);
    const size = BASE_SIZE * scale;
    sprites.push({
      x: Math.random() * (w - size),
      y: Math.random() * (h - size),
      vx: Math.cos(angle) * speed * 0.05,
      vy: Math.sin(angle) * speed * 0.05,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * ROTATION_SPEED,
      scale,
      opacity: MIN_OPACITY + Math.random() * (MAX_OPACITY - MIN_OPACITY),
      depth,
      phase: Math.random() * Math.PI * 2,
      phase2: Math.random() * Math.PI * 2,
      src: SPRITE_TYPES[i % SPRITE_TYPES.length],
      size,
    });
  }
  return sprites;
}

export default function FloatingSprites() {
  const spritesRef = useRef<SpriteState[]>([]);
  const [mounted, setMounted] = useState(false);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    spritesRef.current = createSprites();
    const w = () => window.innerWidth;
    const h = () => window.innerHeight;

    const update = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;
      const width = w();
      const height = h();

      for (const s of spritesRef.current) {
        const depth = s.depth;
        const vx = s.vx * depth;
        const vy = s.vy * depth;

        s.x += vx * 60 * dt;
        s.y += vy * 60 * dt;
        s.rotation += s.rotationSpeed * 60 * dt;

        const size = s.size;
        if (s.x <= 0) {
          s.x = 0;
          s.vx = Math.abs(s.vx);
        }
        if (s.x >= width - size) {
          s.x = width - size;
          s.vx = -Math.abs(s.vx);
        }
        if (s.y <= 0) {
          s.y = 0;
          s.vy = Math.abs(s.vy);
        }
        if (s.y >= height - size) {
          s.y = height - size;
          s.vy = -Math.abs(s.vy);
        }
      }

      setTick((t) => t + 1);
      rafRef.current = requestAnimationFrame(update);
    };

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mounted]);

  if (!mounted) return null;

  const time = typeof performance !== "undefined" ? performance.now() : 0;

  return (
    <div
      className="fixed inset-0 z-1 pointer-events-none overflow-hidden"
      aria-hidden
    >
      {spritesRef.current.map((s, i) => {
        const wobbleX =
          Math.sin(time * 0.001 * WOBBLE_SPEED + s.phase) * WOBBLE_AMPLITUDE;
        const wobbleY =
          Math.cos(time * 0.001 * WOBBLE_SPEED * 0.7 + s.phase2) *
          WOBBLE_AMPLITUDE;
        const left = s.x + wobbleX;
        const top = s.y + wobbleY;
        return (
          <div
            key={i}
            className="absolute will-change-transform"
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              transform: `rotate(${s.rotation}deg) scale(${s.scale})`,
              transformOrigin: "center center",
            }}
          >
            <Image
              src={s.src}
              alt=""
              width={BASE_SIZE}
              height={BASE_SIZE}
              className="w-full h-full object-contain select-none"
              draggable={false}
              unoptimized
            />
          </div>
        );
      })}
    </div>
  );
}
