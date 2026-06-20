import React, { useEffect, useRef } from "react";
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

interface SpringPreviewProps {
  type: "time" | "physics";
  // Time-based props
  duration?: number;
  bounce?: number;
  // Physics-based props
  stiffness?: number;
  damping?: number;
  mass?: number;
  // Common props
  delay?: number;
  onChange?: (values: {
    duration: number;
    bounce: number;
    stiffness: number;
    damping: number;
    mass: number;
    delay: number;
  }) => void;
}

export const SpringPreview: React.FC<SpringPreviewProps> = ({
  type,
  duration = 0.4,
  bounce = 0.2,
  stiffness = 400,
  damping = 30,
  mass = 1,
  delay = 0,
  onChange,
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<SVGSVGElement>(null);
  const size = 300;

  useEffect(() => {
    const element = previewRef.current;
    if (!element) return;

    let animation: Animation | undefined;
    try {
      if (type === "time") {
        // Calculate bounce amplitudes based on the bounce parameter
        const initialOvershoot = 40 + bounce * 160; // More extreme initial overshoot
        const secondBounce = -(bounce * 120); // More pronounced second bounce
        const thirdBounce = bounce * 80; // Add a third bounce
        const fourthBounce = -(bounce * 40); // Add a fourth bounce

        animation = element.animate(
          [
            { transform: "translateX(0)" },
            {
              transform: `translateX(${240 + initialOvershoot}px)`,
              offset: 0.3,
            },
            { transform: `translateX(${240 + secondBounce}px)`, offset: 0.5 },
            { transform: `translateX(${240 + thirdBounce}px)`, offset: 0.7 },
            { transform: `translateX(${240 + fourthBounce}px)`, offset: 0.85 },
            { transform: "translateX(240px)" },
          ],

          {
            duration: duration * 1000, // Exact duration as specified
            easing: "ease-out", // Use ease-out for smoother bounces
            iterations: Infinity,
          },
        );
      } else {
        // Calculate more dramatic overshoot
        const normalizedDamping = Math.max(0.05, 1 - damping / 100);
        const normalizedStiffness = stiffness / 200;
        const normalizedMass = mass / 10;

        // Calculate base amplitude for the spring motion
        const baseAmplitude =
          normalizedDamping * normalizedStiffness * normalizedMass * 400;
        const amplitude = Math.min(500, baseAmplitude);

        // Center point of the animation (half of the available space)
        const center = 120;

        // More natural spring motion using centered oscillation
        animation = element.animate(
          [
            { transform: "translateX(0)" },
            { transform: `translateX(${center + amplitude}px)`, offset: 0.15 }, // First peak
            {
              transform: `translateX(${center - amplitude * 0.9}px)`,
              offset: 0.35,
            }, // First valley
            {
              transform: `translateX(${center + amplitude * 0.7}px)`,
              offset: 0.5,
            }, // Second peak
            {
              transform: `translateX(${center - amplitude * 0.5}px)`,
              offset: 0.65,
            }, // Second valley
            {
              transform: `translateX(${center + amplitude * 0.3}px)`,
              offset: 0.8,
            }, // Third peak
            {
              transform: `translateX(${center - amplitude * 0.1}px)`,
              offset: 0.9,
            }, // Final valley
            { transform: `translateX(${center}px)` }, // Rest position
          ],
          {
            duration: Math.min(5000, 1000 + mass * 200 + damping * 10),
            easing: "linear", // Using linear here since we're controlling the motion with keyframes
            iterations: Infinity,
          },
        );
      }
    } catch (error) {
      console.error("Animation error:", error);
    }

    return () => {
      if (animation) {
        animation.cancel();
      }
    };
  }, [type, duration, bounce, stiffness, damping, mass, delay]);

  // Controls for time-based spring
  const handleTimeBasedChange = (
    field: "duration" | "bounce",
    value: number,
  ) => {
    if (onChange) {
      onChange({
        duration: field === "duration" ? value : duration,
        bounce: field === "bounce" ? value : bounce,
        stiffness,
        damping,
        mass,
        delay,
      });
    }
  };

  // Controls for physics-based spring
  const handlePhysicsBasedChange = (
    field: "stiffness" | "damping" | "mass",
    value: number,
  ) => {
    if (onChange) {
      onChange({
        duration,
        bounce,
        stiffness: field === "stiffness" ? value : stiffness,
        damping: field === "damping" ? value : damping,
        mass: field === "mass" ? value : mass,
        delay,
      });
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div
        style={{
          marginBottom: "2rem",
          width: "300px",
          height: "200px",
          boxSizing: "border-box",
        }}
      >
        {/* Spring controls */}
        {type === "time" ? (
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <label 
                style={{ 
                  display: "block", 
                  marginBottom: "0.5rem",
                  color: "var(--color-Neutral)",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Duration: {duration}s
              </label>
              <Slider
                min={0.3}
                max={2}
                step={0.1}
                value={duration}
                onChange={(value) => handleTimeBasedChange("duration", value as number)}
                railStyle={{ backgroundColor: 'var(--color-bg-secondary)' }}
                trackStyle={{ backgroundColor: 'var(--color-primary)' }}
                handleStyle={{
                  borderColor: 'var(--color-primary)',
                  backgroundColor: 'var(--color-primary)',
                  boxShadow: '0 2px 4px var(--color-shadow)',
                }}
              />
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label 
                style={{ 
                  display: "block", 
                  marginBottom: "0.5rem",
                  color: "var(--color-Neutral)",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Bounce: {bounce}
              </label>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={bounce}
                onChange={(value) => handleTimeBasedChange("bounce", value as number)}
                railStyle={{ backgroundColor: 'var(--color-bg-secondary)' }}
                trackStyle={{ backgroundColor: 'var(--color-primary)' }}
                handleStyle={{
                  borderColor: 'var(--color-primary)',
                  backgroundColor: 'var(--color-primary)',
                  boxShadow: '0 2px 4px var(--color-shadow)',
                }}
              />
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <label 
                style={{ 
                  display: "block", 
                  marginBottom: "0.5rem",
                  color: "var(--color-Neutral)",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Mass: {mass}
              </label>
              <Slider
                min={1}
                max={20}
                step={1}
                value={mass}
                onChange={(value) => handlePhysicsBasedChange("mass", value as number)}
                railStyle={{ backgroundColor: 'var(--color-bg-secondary)' }}
                trackStyle={{ backgroundColor: 'var(--color-primary)' }}
                handleStyle={{
                  borderColor: 'var(--color-primary)',
                  backgroundColor: 'var(--color-primary)',
                  boxShadow: '0 2px 4px var(--color-shadow)',
                }}
              />
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label 
                style={{ 
                  display: "block", 
                  marginBottom: "0.5rem",
                  color: "var(--color-Neutral)",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Tension: {stiffness}
              </label>
              <Slider
                min={1}
                max={500}
                step={1}
                value={stiffness}
                onChange={(value) => handlePhysicsBasedChange("stiffness", value as number)}
                railStyle={{ backgroundColor: 'var(--color-bg-secondary)' }}
                trackStyle={{ backgroundColor: 'var(--color-primary)' }}
                handleStyle={{
                  borderColor: 'var(--color-primary)',
                  backgroundColor: 'var(--color-primary)',
                  boxShadow: '0 2px 4px var(--color-shadow)',
                }}
              />
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label 
                style={{ 
                  display: "block", 
                  marginBottom: "0.5rem",
                  color: "var(--color-Neutral)",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Friction: {damping}
              </label>
              <Slider
                min={1}
                max={180}
                step={1}
                value={damping}
                onChange={(value) => handlePhysicsBasedChange("damping", value as number)}
                railStyle={{ backgroundColor: 'var(--color-bg-secondary)' }}
                trackStyle={{ backgroundColor: 'var(--color-primary)' }}
                handleStyle={{
                  borderColor: 'var(--color-primary)',
                  backgroundColor: 'var(--color-primary)',
                  boxShadow: '0 2px 4px var(--color-shadow)',
                }}
              />
            </div>
          </div>
        )}

        <svg
          ref={graphRef}
          width={size}
          height="200"
          viewBox={`0 0 ${size} 200`}
          style={{
            background: "white",
            borderRadius: "8px",
            display: "block",
            margin: "auto",
          }}
        >
          {/* Remove the spring curve visualization path */}
        </svg>
      </div>

      <div
        style={{
          width: size + 60,
          height: 76,
          background: "var(--color-bg-primary)",
          borderRadius: "var(--border-radius-default)",
          position: "relative",
          overflow: "visible",
          margin: "0",
        }}
      >
        <div
          ref={previewRef}
          style={{
            width: "60px",
            height: "60px",
            background: "var(--color-primary)",
            borderRadius: "50%",
            position: "absolute",
            top: "50%",
            left: "0",
            transform: "translateY(-50%)",
            boxShadow: "0 2px 4px var(--color-shadow)",
            willChange: "transform",
          }}
        />
      </div>
    </div>
  );
};
