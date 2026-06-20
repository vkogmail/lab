import "framer-plugin/framer.css"
import React, { useState } from "react"
import ReactDOM from "react-dom/client"
import { App as ClassicApp } from "./App"
import { App } from "./new/App"

const VersionSwitcher = () => {
  const [useNewVersion, setUseNewVersion] = useState(true);

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 8,
        right: 8,
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.8)',
        padding: '8px',
        borderRadius: '6px',
        zIndex: 9999,
      }}>
        <div style={{
          color: 'white',
          fontSize: 12,
          fontWeight: 500,
        }}>
          {useNewVersion ? '✨ New Version' : '🔄 Legacy Version'}
        </div>
        <button 
          onClick={() => setUseNewVersion(!useNewVersion)}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: 'none',
            background: useNewVersion ? '#4CAF50' : '#2196F3',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Switch Version
        </button>
      </div>
      {useNewVersion ? <App /> : <ClassicApp />}
    </>
  );
};

const root = document.getElementById("root")
if (!root) throw new Error("Root element not found")

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <VersionSwitcher />
    </React.StrictMode>
)
