import React, { useEffect, useState } from "react";

interface ProgressProps {
  progress: number;
  color?: string;
}

const Progress: React.FC<ProgressProps> = ({ progress, color = "#0066FF" }) => {
  const [currentProgress, setCurrentProgress] = useState(progress);

  useEffect(() => {
    setCurrentProgress(progress);
  }, [progress]);

  return (
    <div
      style={{
        width: "100%",
        height: "2px",
        background: "var(--slider-bg)",
        position: "relative",
        overflow: "hidden",
        borderRadius: "1px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: `${currentProgress * 100}%`,
          background: color,
          transition: "width 0.2s ease-out",
        }}
      />
    </div>
  );
};

export default Progress;
