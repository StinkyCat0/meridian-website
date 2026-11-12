// src/main.jsx - DEBUG VERSION
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';

// 🔍 DEBUG: Log React startup
console.log('🚀 Meridian Studios React app starting at', new Date().toISOString());
console.log('🔍 User agent:', navigator.userAgent);
console.log('🔍 Document readyState:', document.readyState);

// 🔍 DEBUG: Add visible overlay to confirm React is mounting
const debugOverlay = document.createElement('div');
debugOverlay.id = 'meridian-debug-overlay';
debugOverlay.style.cssText = `
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  padding: 2rem;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  line-height: 1.6;
`;
debugOverlay.innerHTML = `
  <div style="margin-bottom: 1rem;">
    <h1 style="color: #00ff00; margin: 0 0 0.5rem; font-size: 1.5rem;">✅ REACT LOADED!</h1>
    <p style="margin: 0; color: #888;">If you see this, React mounted successfully.</p>
  </div>
  <div style="background: #1a1a2e; padding: 1rem; border-radius: 8px; max-width: 600px; text-align: left;">
    <p style="margin: 0.25rem 0;"><strong>📅 Time:</strong> ${new Date().toLocaleTimeString()}</p>
    <p style="margin: 0.25rem 0;"><strong>🌐 URL:</strong> ${window.location.href}</p>
    <p style="margin: 0.25rem 0;"><strong>🔐 Protocol:</strong> ${window.location.protocol}</p>
    <p style="margin: 0.25rem 0;"><strong>🧩 React version:</strong> ${React.version}</p>
    <p style="margin: 0.25rem 0;"><strong>🎨 Root element:</strong> ${document.getElementById('root') ? 'found' : 'MISSING'}</p>
  </div>
  <p style="margin-top: 1.5rem; color: #666; font-size: 12px;">
    Debug overlay will disappear in 5 seconds...<br/>
    Check browser Console (F12) for detailed logs.
  </p>
`;
document.body.appendChild(debugOverlay);

// 🔍 DEBUG: Catch unhandled errors
window.addEventListener('error', (event) => {
  console.error('❌ Unhandled error:', event.message, event.filename, event.lineno);
  if (debugOverlay) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'color: #ff6b6b; margin-top: 1rem; background: #2d132c; padding: 0.5rem 1rem; border-radius: 4px;';
    errorDiv.textContent = `❌ Error: ${event.message}`;
    debugOverlay.appendChild(errorDiv);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
});

// 🔍 DEBUG: Remove overlay after 5 seconds and mount React normally
setTimeout(() => {
  console.log('🎨 Removing debug overlay, mounting React app...');
  if (debugOverlay.parentNode) {
    debugOverlay.parentNode.removeChild(debugOverlay);
  }
  
  // Mount the actual React app
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('❌ CRITICAL: #root element not found!');
    document.body.innerHTML = '<div style="color:red;padding:2rem;font-family:monospace">❌ ERROR: #root element missing! Check index.html</div>';
    return;
  }
  
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
    console.log('✅ React app mounted successfully');
  } catch (err) {
    console.error('❌ Failed to mount React app:', err);
    document.body.innerHTML = `<div style="color:red;padding:2rem;font-family:monospace">❌ MOUNT ERROR: ${err.message}</div>`;
  }
}, 5000);
