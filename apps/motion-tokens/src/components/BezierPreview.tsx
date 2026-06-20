import React, { useState, useCallback, useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
}

interface BezierPreviewProps {
  coordinates: [number, number, number, number];
  onChange: (value: [number, number, number, number]) => void;
}

export const BezierPreview: React.FC<BezierPreviewProps> = ({
  coordinates = [0.4, 0, 0.2, 1],
  onChange,
}) => {
  const [activeHandle, setActiveHandle] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const size = 300;
  const padding = 32;
  const totalSize = size + padding * 2;

  const points: Point[] = [
    { x: padding, y: size + padding },
    {
      x: padding + coordinates[0] * size,
      y: size + padding - coordinates[1] * size,
    },
    {
      x: padding + coordinates[2] * size,
      y: size + padding - coordinates[3] * size,
    },
    { x: padding + size, y: padding },
  ];

  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveHandle(index);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (activeHandle === null || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const x = Math.max(
        padding,
        Math.min(size + padding, e.clientX - rect.left),
      );
      const y = Math.max(
        padding,
        Math.min(size + padding, e.clientY - rect.top),
      );

      const newCoords = [...coordinates];
      if (activeHandle === 1) {
        newCoords[0] = (x - padding) / size;
        newCoords[1] = (size - (y - padding)) / size;
      } else if (activeHandle === 2) {
        newCoords[2] = (x - padding) / size;
        newCoords[3] = (size - (y - padding)) / size;
      }

      onChange(newCoords as [number, number, number, number]);
    },
    [activeHandle, coordinates, onChange],
  );

  const handleMouseUp = useCallback(() => {
    setActiveHandle(null);
  }, []);

  useEffect(() => {
    if (activeHandle !== null) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [activeHandle, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const element = previewRef.current;
    if (!element) return;

    const animation = element.animate(
      [
        { transform: "translateX(0)" },
        { transform: `translateX(${size - 60}px)` },
      ],

      {
        duration: 1500,
        easing: `cubic-bezier(${coordinates.join(",")})`,
        iterations: Infinity,
      },
    );

    return () => animation.cancel();
  }, [coordinates]);

  const curvePath = `M ${points[0].x},${points[0].y} C ${points[1].x},${points[1].y} ${points[2].x},${points[2].y} ${points[3].x},${points[3].y}`;

  return (
    <div>
      <div
        style={{
          marginBottom: "1rem",
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#666",
        }}
      >
        cubic-bezier({coordinates.map((v) => v.toFixed(2)).join(", ")})
      </div>

      <div
        style={{
          marginBottom: "2rem",
          width: totalSize,
          height: totalSize,
          boxSizing: "border-box",
        }}
      >
        <svg
          ref={svgRef}
          width={totalSize}
          height={totalSize}
          viewBox={`0 0 ${totalSize} ${totalSize}`}
          style={{
            background: "var(--color-bg-secondary)",
            borderRadius: "var(--border-radius-default)",
            border: "1px solid var(--color-border)",
            touchAction: "none",
            display: "block",
            margin: "auto",
          }}
        >
          <rect
            x={padding}
            y={padding}
            width={size}
            height={size}
            fill="var(--color-bg-primary)"
            stroke="var(--color-border)"
            strokeOpacity="0.4"
            strokeWidth="1"
          />

          <g stroke="var(--color-primary)" strokeOpacity="0.2" strokeWidth="1">
            {Array.from({ length: 10 }, (_, i) => (
              <React.Fragment key={i}>
                <line
                  x1={padding}
                  y1={padding + (i * size) / 10}
                  x2={padding + size}
                  y2={padding + (i * size) / 10}
                />

                <line
                  x1={padding + (i * size) / 10}
                  y1={padding}
                  x2={padding + (i * size) / 10}
                  y2={padding + size}
                />
              </React.Fragment>
            ))}
          </g>

          <line
            x1={points[0].x}
            y1={points[0].y}
            x2={points[1].x}
            y2={points[1].y}
            stroke="var(--color-Neutral)"
            strokeWidth="1"
            strokeDasharray="5,5"
          />

          <line
            x1={points[2].x}
            y1={points[2].y}
            x2={points[3].x}
            y2={points[3].y}
            stroke="var(--color-Neutral)"
            strokeWidth="1"
            strokeDasharray="5,5"
          />

          <path d={curvePath} fill="none" stroke="var(--color-primary)" strokeWidth="2" />

          <circle
            cx={points[1].x}
            cy={points[1].y}
            r={8}
            fill="var(--color-primary)"
            cursor="move"
            onMouseDown={handleMouseDown(1)}
            style={{ touchAction: "none" }}
          />

          <circle
            cx={points[2].x}
            cy={points[2].y}
            r={8}
            fill="var(--color-primary)"
            cursor="move"
            onMouseDown={handleMouseDown(2)}
            style={{ touchAction: "none" }}
          />

          <circle cx={points[0].x} cy={points[0].y} r={4} fill="#999999" />

          <circle cx={points[3].x} cy={points[3].y} r={4} fill="#999999" />
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
            width: 60,
            height: 60,
            background: "var(--color-primary)",
            borderRadius: "50%",
            position: "absolute",
            top: "10%",
            transform: "translateY(-20%)",
            boxShadow: "0 2px 4px var(--color-shadow)",
          }}
        />
      </div>
    </div>
  );
};

export default BezierPreview;
