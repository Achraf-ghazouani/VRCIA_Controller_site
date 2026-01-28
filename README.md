# VRCIA Controller - WebSocket Server

A lightweight WebSocket server that broadcasts color commands between web clients and Unity applications.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install the `ws` WebSocket library.

### 2. Start the Server

```bash
npm start
```

Or directly with Node.js:

```bash
node server.js
```

### 3. Expected Output

```
═══════════════════════════════════════
🚀 WebSocket Server Started
═══════════════════════════════════════
  Port: 8080
  WebSocket URL: ws://localhost:8080
  Health Check: http://localhost:8080/health
  Time: 1/28/2026, 10:30:00 AM
═══════════════════════════════════════
Waiting for connections...
```

## 📡 Usage

### Connect from Web Browser

Open `index.html` in your browser. The website will automatically connect to `ws://localhost:8080`.

### Connect from Unity

Use Unity's WebSocket client to connect to `ws://localhost:8080` and send/receive color strings.

### Test with Health Check

Visit `http://localhost:8080/health` in your browser to see server status:

```json
{
  "status": "ok",
  "connections": 2,
  "timestamp": "2026-01-28T10:30:00.000Z"
}
```

## 📨 Message Format

### Send Color Command (Simple String)

```javascript
// From web or Unity - just send the color name
ws.send("red");
ws.send("blue");
ws.send("green");
ws.send("yellow");
```

### Send Color Command (JSON Format)

```javascript
// Optional JSON format with metadata
ws.send(JSON.stringify({
  color: "red",
  clientType: "web" // or "unity"
}));
```

### Received Broadcast Format

When a client sends a color, all other clients receive:

```json
{
  "type": "color",
  "color": "red",
  "from": "client_1",
  "timestamp": "2026-01-28T10:30:00.000Z"
}
```

## 🔧 Features

- ✅ Broadcasts messages to all connected clients
- ✅ Supports both web and Unity clients
- ✅ Automatic connection health monitoring (heartbeat)
- ✅ Graceful shutdown handling
- ✅ Detailed logging of all connections and messages
- ✅ Health check endpoint
- ✅ Client identification and tracking
- ✅ Error handling and recovery

## 📊 Server Logs

The server provides detailed logging:

```
✓ New connection: client_1
  IP: ::1
  Total connections: 1

📨 Message received from client_1 (web)
  Content: "red"
  Size: 3 bytes
  ✓ Broadcast to 1 other client(s)

✗ Connection closed: client_1 (web)
  Duration: 45s
  Messages sent: 12
```

## 🛑 Stop the Server

Press `Ctrl+C` in the terminal. The server will:
1. Notify all connected clients
2. Close all connections gracefully
3. Shut down cleanly

## 🔍 Troubleshooting

### Port Already in Use

If port 8080 is already in use, edit `server.js` and change:

```javascript
const PORT = 8080; // Change to another port like 3000
```

### Cannot Connect from Unity

Make sure Unity's WebSocket client connects to the correct URL:
- Local testing: `ws://localhost:8080`
- Network testing: `ws://YOUR_IP:8080`

### Firewall Issues

If connecting from another device, ensure:
- Windows Firewall allows Node.js
- Port 8080 is open for inbound connections

## 📁 Project Structure

```
VRCIA_Controller_site/
├── server.js          # WebSocket server
├── package.json       # Node.js dependencies
├── index.html         # Web client
├── style.css          # Web client styles
├── script.js          # Web client logic
└── README.md          # This file
```

## 💡 Tips

- The server accepts connections from any origin (CORS-friendly)
- Messages can be plain strings or JSON
- All clients receive broadcasts except the sender
- Dead connections are automatically cleaned up every 30 seconds
- Server statistics are logged every 5 minutes

## 🔗 Testing the Complete Setup

1. Start the server: `npm start`
2. Open `index.html` in multiple browser tabs
3. Click a color button in one tab
4. See the message appear in all other tabs
5. Connect Unity app - it will receive all color broadcasts

---

**Ready to go!** 🎉
