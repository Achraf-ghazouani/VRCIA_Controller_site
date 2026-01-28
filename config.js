/**
 * Configuration for WebSocket connection
 * Change WS_SERVER_URL based on your deployment
 */

const CONFIG = {
    // Automatically use local WebSocket for local development,
    // or Render WebSocket for production
    
    WS_SERVER_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'ws://localhost:8080'  // Local development
        : 'wss://vrcia-controller-site.onrender.com'  // Production Render WebSocket
};
