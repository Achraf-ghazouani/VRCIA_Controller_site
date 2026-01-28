/**
 * WebSocket Server for Color Controller
 * Broadcasts color commands to all connected clients (web and Unity)
 */

// ===========================
// Import Dependencies
// ===========================

const WebSocket = require('ws');
const http = require('http');

// ===========================
// Configuration
// ===========================

const PORT = process.env.PORT || 8080; // Use environment PORT or default to 8080
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// ===========================
// Create HTTP Server
// ===========================

const server = http.createServer((req, res) => {
    // Simple health check endpoint
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'ok', 
            connections: wss.clients.size,
            timestamp: new Date().toISOString()
        }));
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('WebSocket Server Running\n');
    }
});

// ===========================
// Create WebSocket Server
// ===========================

const wss = new WebSocket.Server({ 
    server,
    // Accept connections from any origin (for cross-origin support)
    verifyClient: (info) => {
        console.log(`Connection request from origin: ${info.origin || 'unknown'}`);
        return true; // Accept all connections
    }
});

// ===========================
// Client Management
// ===========================

// Track connected clients with metadata
const clients = new Map();
let clientIdCounter = 1;

/**
 * Generate unique client ID
 * @returns {string} Unique client identifier
 */
function generateClientId() {
    return `client_${clientIdCounter++}`;
}

/**
 * Get client info string for logging
 * @param {string} clientId - Client identifier
 * @returns {string} Formatted client info
 */
function getClientInfo(clientId) {
    const client = clients.get(clientId);
    if (!client) return clientId;
    return `${clientId} (${client.type || 'unknown'})`;
}

// ===========================
// WebSocket Event Handlers
// ===========================

/**
 * Handle new WebSocket connection
 */
wss.on('connection', (ws, req) => {
    // Generate unique ID for this client
    const clientId = generateClientId();
    const clientIp = req.socket.remoteAddress;
    
    // Store client metadata
    clients.set(clientId, {
        ws: ws,
        id: clientId,
        ip: clientIp,
        connectedAt: new Date(),
        type: 'unknown', // Will be updated based on first message
        isAlive: true,
        messageCount: 0
    });
    
    // Attach client ID to WebSocket object
    ws.clientId = clientId;
    
    console.log('═══════════════════════════════════════');
    console.log(`✓ New connection: ${clientId}`);
    console.log(`  IP: ${clientIp}`);
    console.log(`  Total connections: ${wss.clients.size}`);
    console.log('═══════════════════════════════════════');
    
    // Don't send welcome message - Unity expects only hex codes, not JSON
    
    // ===========================
    // Handle incoming messages
    // ===========================
    
    ws.on('message', (data) => {
        try {
            const client = clients.get(clientId);
            if (client) {
                client.messageCount++;
            }
            
            // Convert buffer to string
            const message = data.toString();
            
            console.log('─────────────────────────────────────');
            console.log(`📨 Message received from ${getClientInfo(clientId)}`);
            console.log(`  Content: "${message}"`);
            console.log(`  Size: ${data.length} bytes`);
            console.log(`  Time: ${new Date().toLocaleTimeString()}`);
            
            // Try to parse as JSON, if fails treat as plain string
            let parsedData;
            let isJson = false;
            
            try {
                parsedData = JSON.parse(message);
                isJson = true;
                
                // Update client type if provided
                if (parsedData.clientType && client) {
                    client.type = parsedData.clientType;
                    console.log(`  Client type identified: ${parsedData.clientType}`);
                }
            } catch (e) {
                parsedData = message;
            }
            
            // Extract the hex code to broadcast
            const hexCode = isJson ? (parsedData.color || parsedData.message || message) : message;
            
            // Broadcast only the hex code (Unity expects plain strings, not JSON)
            broadcast(hexCode, ws);
            
            console.log(`  ✓ Broadcast "${hexCode}" to ${wss.clients.size - 1} other client(s)`);
            console.log('─────────────────────────────────────');
            
            // Don't send acknowledgment - Unity expects only hex codes
            
        } catch (error) {
            console.error(`Error processing message from ${clientId}:`, error.message);
            sendToClient(ws, JSON.stringify({
                type: 'error',
                message: 'Failed to process message',
                error: error.message
            }));
        }
    });
    
    // ===========================
    // Handle client disconnect
    // ===========================
    
    ws.on('close', (code, reason) => {
        const client = clients.get(clientId);
        const duration = client ? 
            Math.round((Date.now() - client.connectedAt.getTime()) / 1000) : 0;
        const msgCount = client ? client.messageCount : 0;
        
        console.log('═══════════════════════════════════════');
        console.log(`✗ Connection closed: ${getClientInfo(clientId)}`);
        console.log(`  Code: ${code}`);
        console.log(`  Reason: ${reason || 'No reason provided'}`);
        console.log(`  Duration: ${duration}s`);
        console.log(`  Messages sent: ${msgCount}`);
        console.log(`  Remaining connections: ${wss.clients.size - 1}`);
        console.log('═══════════════════════════════════════');
        
        // Remove client from map
        clients.delete(clientId);
        
        // Notify remaining clients
        broadcastSystemMessage(`Client ${clientId} left`);
    });
    
    // ===========================
    // Handle errors
    // ===========================
    
    ws.on('error', (error) => {
        console.error(`❌ WebSocket error for ${getClientInfo(clientId)}:`, error.message);
    });
    
    // ===========================
    // Setup heartbeat/ping-pong
    // ===========================
    
    ws.isAlive = true;
    
    ws.on('pong', () => {
        ws.isAlive = true;
        const client = clients.get(clientId);
        if (client) {
            client.isAlive = true;
        }
    });
});

// ===========================
// Broadcasting Functions
// ===========================

/**
 * Broadcast message to all connected clients except sender
 * @param {string} message - Message to broadcast
 * @param {WebSocket} sender - Sender's WebSocket (will be excluded)
 */
function broadcast(message, sender = null) {
    wss.clients.forEach((client) => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

/**
 * Broadcast system message to all clients except sender
 * @param {string} message - System message
 * @param {WebSocket} sender - Sender to exclude
 */
function broadcastSystemMessage(message, sender = null) {
    const systemMsg = JSON.stringify({
        type: 'system',
        message: message,
        timestamp: new Date().toISOString()
    });
    broadcast(systemMsg, sender);
}

/**
 * Send message to specific client with error handling
 * @param {WebSocket} ws - WebSocket client
 * @param {string} message - Message to send
 */
function sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
        try {
            ws.send(message);
        } catch (error) {
            console.error('Error sending to client:', error.message);
        }
    }
}

// ===========================
// Connection Health Check
// ===========================

/**
 * Heartbeat mechanism to detect dead connections
 * Pings all clients periodically and closes unresponsive ones
 */
function heartbeat() {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            console.log(`⚠️  Terminating inactive connection: ${ws.clientId}`);
            return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
    });
}

// Start heartbeat interval
const heartbeatTimer = setInterval(heartbeat, HEARTBEAT_INTERVAL);

// ===========================
// Server Lifecycle
// ===========================

/**
 * Start the server
 */
server.listen(PORT, () => {
    console.log('═══════════════════════════════════════');
    console.log('🚀 WebSocket Server Started');
    console.log('═══════════════════════════════════════');
    console.log(`  Port: ${PORT}`);
    console.log(`  WebSocket URL: ws://localhost:${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/health`);
    console.log(`  Time: ${new Date().toLocaleString()}`);
    console.log('═══════════════════════════════════════');
    console.log('Waiting for connections...\n');
});

// ===========================
// Graceful Shutdown
// ===========================

/**
 * Gracefully shutdown server on termination signals
 */
function shutdown() {
    console.log('\n═══════════════════════════════════════');
    console.log('🛑 Shutting down server...');
    console.log('═══════════════════════════════════════');
    
    // Clear heartbeat timer
    clearInterval(heartbeatTimer);
    
    // Notify all clients
    const shutdownMsg = JSON.stringify({
        type: 'system',
        message: 'Server is shutting down',
        timestamp: new Date().toISOString()
    });
    
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(shutdownMsg);
            client.close(1001, 'Server shutdown');
        }
    });
    
    // Close server
    wss.close(() => {
        console.log('✓ WebSocket server closed');
        server.close(() => {
            console.log('✓ HTTP server closed');
            console.log('Goodbye!\n');
            process.exit(0);
        });
    });
    
    // Force exit after 5 seconds if graceful shutdown fails
    setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
    }, 5000);
}

// Handle termination signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// ===========================
// Status Monitoring
// ===========================

/**
 * Log server statistics periodically (every 5 minutes)
 */
setInterval(() => {
    console.log('─────────────────────────────────────');
    console.log('📊 Server Status');
    console.log(`  Active connections: ${wss.clients.size}`);
    console.log(`  Uptime: ${Math.round(process.uptime())}s`);
    console.log(`  Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    console.log('─────────────────────────────────────');
}, 300000); // 5 minutes
