/**
 * Configuration for WebSocket connection
 * Change WS_SERVER_URL based on your deployment
 */

const CONFIG = {
    // Local development
    // WS_SERVER_URL: 'ws://localhost:8080',
    
    // Production - Replace with your deployed WebSocket server URL
    // Examples:
    // Railway: 'wss://your-app.railway.app'
    // Render: 'wss://your-app.onrender.com'
    // Heroku: 'wss://your-app.herokuapp.com'
    // ngrok (for testing): 'wss://your-id.ngrok.io'
    
    WS_SERVER_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'ws://localhost:8080'  // Local development
        : 'wss://your-websocket-server.railway.app'  // Production - CHANGE THIS!
};
