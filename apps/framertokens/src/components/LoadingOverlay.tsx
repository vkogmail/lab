import { motion } from "framer-motion";

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner">
          <div style={{ position: 'relative', width: 48, height: 48, zIndex: 1 }}>
            {/* Static vertical piece */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 48 16"
              style={{ 
                width: 48, 
                height: 48,
                position: 'absolute',
                top: '83%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(90deg)',
                overflow: 'visible',
                zIndex: 1
              }}
            >
              <path
                d="M 40 0 C 44.418 0 48 3.582 48 8 C 48 12.418 44.418 16 40 16 L 8 16 C 3.582 16 0 12.418 0 8 C 0 3.582 3.582 0 8 0 Z M 8 13 C 10.761 13 13 10.761 13 8 C 13 5.239 10.761 3 8 3 C 5.239 3 3 5.239 3 8 C 3 10.761 5.239 13 8 13 Z M 24 3 C 21.239 3 19 5.239 19 8 C 19 10.761 21.239 13 24 13 C 26.761 13 29 10.761 29 8 C 29 5.239 26.761 3 24 3 Z M 40 13 C 42.761 13 45 10.761 45 8 C 45 5.239 42.761 3 40 3 C 37.239 3 35 5.239 35 8 C 35 10.761 37.239 13 40 13 Z"
                fill="var(--framer-color-text-secondary)"
              />
            </svg>

            {/* Spinning horizontal piece */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 48 16"
              style={{ 
                width: 48, 
                height: 48,
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                overflow: 'visible',
                opacity: 0.7,
                zIndex: 2
              }}
            >
              <motion.path
                d="M 40 0 C 44.418 0 48 3.582 48 8 C 48 12.418 44.418 16 40 16 L 8 16 C 3.582 16 0 12.418 0 8 C 0 3.582 3.582 0 8 0 Z M 8 13 C 10.761 13 13 10.761 13 8 C 13 5.239 10.761 3 8 3 C 5.239 3 3 5.239 3 8 C 3 10.761 5.239 13 8 13 Z M 24 3 C 21.239 3 19 5.239 19 8 C 19 10.761 21.239 13 24 13 C 26.761 13 29 10.761 29 8 C 29 5.239 26.761 3 24 3 Z M 40 13 C 42.761 13 45 10.761 45 8 C 45 5.239 42.761 3 40 3 C 37.239 3 35 5.239 35 8 C 35 10.761 37.239 13 40 13 Z"
                fill="var(--framer-color-tint)"
                style={{
                  transformOrigin: '24px 8px'
                }}
                animate={{ 
                  rotate: 360 
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </svg>
          </div>
        </div>
        {message && <div className="loading-message">{message}</div>}
      </div>
    </div>
  );
};
