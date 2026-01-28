/**
 * WebSocket Color Controller
 * Connects to a WebSocket server and sends color commands when buttons are clicked
 */

// ===========================
// Configuration
// ===========================

const WS_SERVER_URL = CONFIG.WS_SERVER_URL;
const RECONNECT_INTERVAL = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5;

// ===========================
// State Management
// ===========================

let websocket = null;
let reconnectAttempts = 0;
let reconnectTimer = null;
let isManualDisconnect = false;

// ===========================
// DOM Elements
// ===========================

const connectionStatus = document.getElementById('connectionStatus');
const messageDisplay = document.getElementById('messageDisplay');
const colorButtons = document.querySelectorAll('.color-btn');

// ===========================
// WebSocket Connection Management
// ===========================

/**
 * Initialize WebSocket connection
 */
function connectWebSocket() {
    try {
        // Prevent multiple connection attempts
        if (websocket && websocket.readyState === WebSocket.CONNECTING) {
            return;
        }

        displayMessage('Connecting to server...', 'info');
        
        // Create new WebSocket connection
        websocket = new WebSocket(WS_SERVER_URL);
        
        // Set up event handlers
        websocket.onopen = handleConnectionOpen;
        websocket.onclose = handleConnectionClose;
        websocket.onerror = handleConnectionError;
        websocket.onmessage = handleMessage;
        
    } catch (error) {
        console.error('WebSocket connection error:', error);
        updateConnectionStatus(false);
        displayMessage(`Connection failed: ${error.message}`, 'error');
        scheduleReconnect();
    }
}

/**
 * Handle successful WebSocket connection
 */
function handleConnectionOpen() {
    console.log('WebSocket connected successfully');
    reconnectAttempts = 0;
    isManualDisconnect = false;
    updateConnectionStatus(true);
    enableButtons(true);
    displayMessage('Connected to server. Ready to send colors!', 'success');
}

/**
 * Handle WebSocket connection closure
 */
function handleConnectionClose(event) {
    console.log('WebSocket connection closed', event);
    updateConnectionStatus(false);
    enableButtons(false);
    
    if (!isManualDisconnect) {
        displayMessage('Connection lost. Attempting to reconnect...', 'error');
        scheduleReconnect();
    } else {
        displayMessage('Disconnected from server', 'info');
    }
}

/**
 * Handle WebSocket errors
 */
function handleConnectionError(error) {
    console.error('WebSocket error:', error);
    displayMessage('Connection error occurred', 'error');
}

/**
 * Handle incoming messages from WebSocket server
 */
function handleMessage(event) {
    console.log('Message received from server:', event.data);
    displayMessage(`Server response: ${event.data}`, 'info');
}

/**
 * Schedule automatic reconnection attempt
 */
function scheduleReconnect() {
    // Clear existing timer
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
    }
    
    // Check if we've exceeded max attempts
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        displayMessage(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts. Please refresh the page.`, 'error');
        return;
    }
    
    reconnectAttempts++;
    
    // Schedule reconnection
    reconnectTimer = setTimeout(() => {
        console.log(`Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        connectWebSocket();
    }, RECONNECT_INTERVAL);
}

/**
 * Send data through WebSocket connection
 * @param {string} data - Data to send
 * @returns {boolean} - Success status
 */
function sendData(data) {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        displayMessage('Cannot send: Not connected to server', 'error');
        return false;
    }
    
    try {
        websocket.send(data);
        console.log('Sent to server:', data);
        return true;
    } catch (error) {
        console.error('Error sending data:', error);
        displayMessage(`Error sending data: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Disconnect WebSocket connection
 */
function disconnectWebSocket() {
    isManualDisconnect = true;
    
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    
    if (websocket) {
        websocket.close();
        websocket = null;
    }
}

// ===========================
// UI Update Functions
// ===========================

/**
 * Update connection status display
 * @param {boolean} isConnected - Connection status
 */
function updateConnectionStatus(isConnected) {
    if (isConnected) {
        connectionStatus.textContent = 'Connected';
        connectionStatus.classList.remove('disconnected');
        connectionStatus.classList.add('connected');
    } else {
        connectionStatus.textContent = 'Disconnected';
        connectionStatus.classList.remove('connected');
        connectionStatus.classList.add('disconnected');
    }
}

/**
 * Display message to user
 * @param {string} message - Message text
 * @param {string} type - Message type (success, error, info)
 */
function displayMessage(message, type = 'info') {
    messageDisplay.textContent = message;
    
    // Remove existing classes
    messageDisplay.classList.remove('success', 'error', 'info');
    
    // Add appropriate class
    if (type === 'success' || type === 'error') {
        messageDisplay.classList.add(type);
    }
    
    // Auto-clear success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            if (messageDisplay.textContent === message) {
                messageDisplay.textContent = '';
                messageDisplay.classList.remove('success');
            }
        }, 3000);
    }
}

/**
 * Enable or disable color buttons
 * @param {boolean} enabled - Enable state
 */
function enableButtons(enabled) {
    colorButtons.forEach(button => {
        button.disabled = !enabled;
    });
}

// ===========================
// Button Event Handlers
// ===========================

/**
 * Handle color button click
 * @param {Event} event - Click event
 */
function handleColorButtonClick(event) {
    const button = event.currentTarget;
    const colorHex = button.getAttribute('data-color');
    const colorName = button.getAttribute('data-name') || colorHex;
    
    if (!colorHex) {
        console.error('No color data attribute found');
        return;
    }
    
    // Send hex code through WebSocket
    const success = sendData(colorHex);
    
    if (success) {
        displayMessage(`Sent: ${colorName} (${colorHex})`, 'success');
        
        // Visual feedback - brief highlight
        button.style.opacity = '0.7';
        setTimeout(() => {
            button.style.opacity = '1';
        }, 150);
    }
}

/**
 * Add click event listeners to all color buttons
 */
function initializeButtons() {
    colorButtons.forEach(button => {
        button.addEventListener('click', handleColorButtonClick);
    });
}

// ===========================
// Keyboard Support
// ===========================

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyPress(event) {
    // Don't trigger if user is typing in an input field
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }
    
    const key = event.key.toLowerCase();
    let colorButton = null;
    
    // Map number keys to colors (1-9, 0 for 10th color)
    const keyMap = {
        '1': '#00FF00',  // Vert
        '2': '#FFFF00',  // Jaune
        '3': '#0080FF',  // Cyan-Bleu
        '4': '#FFFFFF',  // Blanc
        '5': '#808080',  // Gris
        '6': '#000000',  // Noir
        '7': '#FF00FF',  // Magenta
        '8': '#8000FF',  // Violet
        '9': '#FF0000',  // Rouge
        '0': '#00FF80',  // Vert-Cyan
        'q': '#FF0080',  // Rose
        'w': '#80FF00',  // Jaune-Vert
        'e': '#0000FF',  // Bleu
        'r': '#00FFFF',  // Cyan
    };
    
    if (keyMap[key]) {
        colorButton = document.querySelector(`[data-color="${keyMap[key]}"]`);
    }
    
    // Trigger button click if found and enabled
    if (colorButton && !colorButton.disabled) {
        colorButton.click();
    }
}

// ===========================
// Page Visibility Handling
// ===========================

/**
 * Handle page visibility changes
 * Reconnect when page becomes visible if connection was lost
 */
function handleVisibilityChange() {
    if (!document.hidden && (!websocket || websocket.readyState !== WebSocket.OPEN)) {
        console.log('Page visible again, checking connection...');
        if (!isManualDisconnect) {
            connectWebSocket();
        }
    }
}

// ===========================
// Initialization
// ===========================

/**
 * Initialize the application
 */
function init() {
    console.log('Initializing Color Controller...');
    
    // Initialize UI
    initializeButtons();
    enableButtons(false);
    displayMessage('Initializing connection...', 'info');
    
    // Connect to WebSocket server
    connectWebSocket();
    
    // Add keyboard support
    document.addEventListener('keypress', handleKeyPress);
    
    // Handle page visibility
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        disconnectWebSocket();
    });
    
    console.log('Color Controller initialized');
}

// ===========================
// Start Application
// ===========================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ===========================
// Export for testing (if needed)
// ===========================

// Expose functions for debugging in browser console
if (typeof window !== 'undefined') {
    window.ColorController = {
        connect: connectWebSocket,
        disconnect: disconnectWebSocket,
        send: sendData,
        getStatus: () => websocket ? websocket.readyState : 'Not initialized'
    };
}
