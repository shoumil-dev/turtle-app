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
  
  // Physics state
  const velocityRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | undefined>();
  const mousePositionRef = useRef({ x: 0, y: 0 });
  
  // Audio refs for preloading
  const hoverSoundRef = useRef<HTMLAudioElement | null>(null);
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);

  // Preload audio on mount
  useEffect(() => {
    // Preload hover sound
    hoverSoundRef.current = new Audio('/soft_bubble_hover.mp3');
    hoverSoundRef.current.volume = 0.5; // Subtle volume
    hoverSoundRef.current.preload = 'auto';
    
    // Preload click sound
    clickSoundRef.current = new Audio('/soft_click.mp3');
    clickSoundRef.current.volume = 0.6; // Slightly louder for confirmation
    clickSoundRef.current.preload = 'auto';
    
    return () => {
      // Cleanup
      if (hoverSoundRef.current) {
        hoverSoundRef.current.pause();
        hoverSoundRef.current = null;
      }
      if (clickSoundRef.current) {
        clickSoundRef.current.pause();
        clickSoundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const updatePhysics = () => {
      if (!noButtonRef.current) {
        animationFrameRef.current = requestAnimationFrame(updatePhysics);
        return;
      }

      const rect = noButtonRef.current.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      const buttonCenterY = rect.top + rect.height / 2;
      
      const mouseX = mousePositionRef.current.x;
      const mouseY = mousePositionRef.current.y;
      
      // Calculate distance from cursor to button
      const dx = buttonCenterX - mouseX;
      const dy = buttonCenterY - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Repulsion parameters
      const repulsionRadius = 200;
      const panicRadius = 100; // Extra panic when very close
      let maxForce = 2.5;
      let damping = 0.85; // Friction/air resistance
      
      if (distance < repulsionRadius && distance > 0) {
        // Panic reaction - increase speed when very close
        if (distance < panicRadius) {
          maxForce = 4.0; // Panic boost!
          damping = 0.90; // Less friction when panicking
        }
        
        // Calculate repulsion force (stronger when closer)
        const forceMagnitude = maxForce * (1 - distance / repulsionRadius);
        
        // Normalize direction and apply force
        let forceX = (dx / distance) * forceMagnitude;
        let forceY = (dy / distance) * forceMagnitude;
        
        // Add slight randomness for alive feeling
        const randomness = 0.3;
        forceX += (Math.random() - 0.5) * randomness;
        forceY += (Math.random() - 0.5) * randomness;
        
        // Apply acceleration to velocity
        velocityRef.current.x += forceX;
        velocityRef.current.y += forceY;
        
        setNoIsRunning(true);
      } else {
        setNoIsRunning(false);
        // Smoother stop when no force applied
        damping = 0.80; // More friction to ease to stop
      }
      
      // Apply damping to velocity
      velocityRef.current.x *= damping;
      velocityRef.current.y *= damping;
      
      // Calculate wobble/tilt rotation based on velocity
      const targetRotation = velocityRef.current.x * 2; // Tilt based on horizontal velocity
      setRotation(prev => prev + (targetRotation - prev) * 0.1); // Smooth rotation
      
      // Update position based on velocity
      const newX = noButtonPos.x + velocityRef.current.x;
      const newY = noButtonPos.y + velocityRef.current.y;
      
      // Keep within viewport bounds with soft clamping
      const maxX = window.innerWidth / 2 - rect.width / 2 - 50;
      const maxY = window.innerHeight / 2 - rect.height / 2 - 50;
      
      const clampedX = Math.max(-maxX, Math.min(maxX, newX));
      const clampedY = Math.max(-maxY, Math.min(maxY, newY));
      
      // If we hit a boundary, dampen velocity in that direction
      if (clampedX !== newX) velocityRef.current.x *= -0.3;
      if (clampedY !== newY) velocityRef.current.y *= -0.3;
      
      setNoButtonPos({ x: clampedX, y: clampedY });
      
      animationFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animationFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [noButtonPos.x, noButtonPos.y]);

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-red-50 to-pink-200 animate-slideDown relative font-milky-blend">
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
          <h1 className="text-5xl font-bold text-red-600 animate-bounce">
            Thank you for being my valentine!
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
