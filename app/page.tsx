"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function Home() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [yesHovered, setYesHovered] = useState(false);
  const [noButtonPos, setNoButtonPos] = useState({ x: 0, y: 0 });
  const [noIsRunning, setNoIsRunning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const [startHovered, setStartHovered] = useState(false);
  const noButtonRef = useRef<HTMLDivElement>(null);
  
  // Physics state – keep position in a ref so the animation loop doesn't restart every frame
  const noButtonPosRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | undefined>(undefined);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  
  const hoverSoundRef = useRef<HTMLAudioElement | null>(null);
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);
  const cheeringRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    hoverSoundRef.current = new Audio('/soft_bubble_hover.mp3');
    hoverSoundRef.current.volume = 0.5;
    hoverSoundRef.current.preload = 'auto';
    clickSoundRef.current = new Audio('/soft_click.mp3');
    clickSoundRef.current.volume = 0.6;
    clickSoundRef.current.preload = 'auto';
    cheeringRef.current = new Audio('/sounds/kids_cheering.mp3');
    cheeringRef.current.volume = 0.6;
    cheeringRef.current.preload = 'auto';
    return () => {
      [hoverSoundRef, clickSoundRef, cheeringRef].forEach((r) => {
        if (r.current) {
          r.current.pause();
          r.current = null;
        }
      });
    };
  }, []);

  // Play cheering once when the final "Love you" page mounts (user already interacted by clicking Yes)
  useEffect(() => {
    if (!showSuccess) return;
    const audio = cheeringRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.loop = false;
    audio.volume = 0.6;
    audio.play().catch(() => {});
  }, [showSuccess]);

  // Single animation loop: run effect once so we don't restart RAF every frame (was causing jitter)
  useEffect(() => {
    const updatePhysics = () => {
      if (!noButtonRef.current) {
        animationFrameRef.current = requestAnimationFrame(updatePhysics);
        return;
      }

      const rect = noButtonRef.current.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      const buttonCenterY = rect.top + rect.height / 2;

      const pos = noButtonPosRef.current;
      const mouseX = mousePositionRef.current.x;
      const mouseY = mousePositionRef.current.y;

      const dx = buttonCenterX - mouseX;
      const dy = buttonCenterY - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const repulsionRadius = 250;
      const panicRadius = 100;
      let maxForce = 5;
      let damping = 0.85;

      if (distance < repulsionRadius && distance > 0) {
        if (distance < panicRadius) {
          maxForce = 8.0;
          damping = 0.90;
        }
        const forceMagnitude = maxForce * (1 - distance / repulsionRadius);
        let forceX = (dx / distance) * forceMagnitude;
        let forceY = (dy / distance) * forceMagnitude;
        const randomness = 0.15;
        forceX += (Math.random() - 0.5) * randomness;
        forceY += (Math.random() - 0.5) * randomness;
        velocityRef.current.x += forceX;
        velocityRef.current.y += forceY;
        setNoIsRunning(true);
      } else {
        setNoIsRunning(false);
        damping = 0.80;
      }

      velocityRef.current.x *= damping;
      velocityRef.current.y *= damping;

      const targetRotation = velocityRef.current.x * 2;
      setRotation((prev) => prev + (targetRotation - prev) * 0.1);

      const newX = pos.x + velocityRef.current.x;
      const newY = pos.y + velocityRef.current.y;

      const layoutCenterX = buttonCenterX - pos.x;
      const layoutCenterY = buttonCenterY - pos.y;
      const minCenterX = rect.width / 2;
      const maxCenterX = window.innerWidth - rect.width / 2;
      const minCenterY = rect.height / 2;
      const maxCenterY = window.innerHeight - rect.height / 2;
      const clampedCenterX = Math.max(minCenterX, Math.min(maxCenterX, layoutCenterX + newX));
      const clampedCenterY = Math.max(minCenterY, Math.min(maxCenterY, layoutCenterY + newY));
      const clampedX = clampedCenterX - layoutCenterX;
      const clampedY = clampedCenterY - layoutCenterY;

      if (clampedX !== newX) velocityRef.current.x *= -0.3;
      if (clampedY !== newY) velocityRef.current.y *= -0.3;

      noButtonPosRef.current = { x: clampedX, y: clampedY };
      setNoButtonPos({ x: clampedX, y: clampedY });

      animationFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animationFrameRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    mousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleStartHover = () => {
    // Play hover sound on start button hover
    if (hoverSoundRef.current) {
      hoverSoundRef.current.currentTime = 0;
      hoverSoundRef.current.play().catch(() => {});
    }
    setStartHovered(true);
  };

  const handleStart = () => {
    // Play click sound
    if (clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play().catch(() => {});
    }
    
    // Unlock audio by playing and pausing (backup)
    if (hoverSoundRef.current) {
      hoverSoundRef.current.play().then(() => {
        hoverSoundRef.current?.pause();
        hoverSoundRef.current!.currentTime = 0;
      }).catch(() => {});
    }
    
    setAudioReady(true);
  };

  const handleYesHover = () => {
    // Play hover sound - reset to start for snappy re-hovers
    if (hoverSoundRef.current) {
      hoverSoundRef.current.currentTime = 0;
      hoverSoundRef.current.play().catch(err => console.log('Hover sound failed:', err));
    }
    setYesHovered(true);
  };

  const handleYesClick = () => {
    // Play click sound - reset to start for immediate playback
    if (clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play().catch(err => console.log('Click sound failed:', err));
    }
    setShowSuccess(true);
  };

  // Show start screen if audio not ready
  if (!audioReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-white to-red-50 relative font-milky-blend">
        <Image
          src="/background_2.png"
          alt="Background"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div
          className="relative cursor-pointer transition-transform hover:scale-105 z-10"
          onMouseEnter={handleStartHover}
          onMouseLeave={() => setStartHovered(false)}
          onClick={handleStart}
        >
          <Image
            src={startHovered ? "/start_activated.png" : "/start_deactivated.png"}
            alt="Start button"
            width={400}
            height={400}
            className="drop-shadow-2xl"
          />
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-red-50 to-pink-200 relative font-milky-blend">
        <Image
          src="/background_2.png"
          alt="Background"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div className="text-center space-y-8 p-8 relative z-10">
          <Image
            src="/jumping_cat.gif"
            alt="Happy jumping cat"
            width={550}
            height={550}
            className="mx-auto rounded-lg"
            unoptimized
          />
          <h1 className="text-5xl font-bold text-pink-600 animate-spinIn">
            LOVE YOUUUUUUUU!!!!!
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-white to-red-50 overflow-hidden relative font-milky-blend"
      onMouseMove={handleMouseMove}
    >
      <Image
        src="/background_main.png"
        alt="Background"
        fill
        sizes="100vw"
        className="object-cover object-center"
        priority
      />
      <div style={{height: "150px"}}></div>
      <main className="text-center space-y-16 p-8 relative z-10">
        <h1 className="text-6xl font-bold text-black-600 mb-12">
          Do you want to be my valentine? 
        </h1>
        
        <div className="flex gap-16 items-center justify-center">
          {/* Yes Button */}
          <div
            className="relative cursor-pointer transition-transform hover:scale-105"
            onMouseEnter={handleYesHover}
            onMouseLeave={() => setYesHovered(false)}
            onClick={handleYesClick}
          >
            <Image
              src={yesHovered ? "/yes_activated.png" : "/yes_deactivated.png"}
              alt="Yes button"
              width={350}
              height={350}
              className="transition-all duration-300"
            />
          </div>

          {/* No Button */}
          <div
            ref={noButtonRef}
            className="relative cursor-pointer"
            style={{
              transform: `translate(${noButtonPos.x}px, ${noButtonPos.y}px) rotate(${rotation}deg)`,
            }}
          >
            <Image
              src={noIsRunning ? "/no_activated.png" : "/no_deactivated.png"}
              alt="No button"
              width={350}
              height={350}
              className="transition-all duration-300"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
