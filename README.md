# WhatsApp BRE-X

**WhatsApp Business REST Engine** - Multi Session WhatsApp API menggunakan Baileys

## 📋 Deskripsi

WhatsApp BRE-X adalah REST API server untuk WhatsApp yang mendukung multiple session. Dibangun menggunakan TypeScript dengan arsitektur modular yang mudah dikembangkan.

## ✨ Fitur Utama

### 1. 🔌 Integrasi API
- RESTful API endpoints
- Webhook untuk event notifications
- Token-based authentication
- Rate limiting & request validation

### 2. 💬 Chat View
- Kirim & terima pesan teks
- Media support (gambar, video, dokumen, audio)
- Kirim pesan template
- Status pesan (sent, delivered, read)
- Riwayat percakapan

### 3. 🔄 Multi Session
- Multiple WhatsApp accounts dalam satu instance
- Session management (create, delete, reconnect)
- QR Code authentication
- Auto reconnect on disconnect
- Session state persistence

## 🛠️ Tech Stack

- **Runtime**: Node.js >= 18
- **Language**: TypeScript (ESModule)
- **WhatsApp Library**: [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) v7.0.0-rc.9
- **Web Framework**: Express.js
- **Logger**: Pino

## 📁 Struktur Project

```
whatsapp-bre-x/
├── src/
│   ├── index.ts              # Entry point
│   ├── config/
│   │   └── index.ts          # Configuration
│   ├── api/
│   │   ├── routes/           # API routes
│   │   │   ├── index.ts
│   │   │   ├── session.ts    # Session management
│   │   │   ├── message.ts    # Messaging endpoints
│   │   │   └── chat.ts       # Chat/conversation endpoints
│   │   └── middleware/       # Express middlewares
│   │       ├── auth.ts
│   │       └── error.ts
│   ├── services/
│   │   ├── session.ts        # Session manager
│   │   ├── whatsapp.ts       # Baileys wrapper
│   │   └── webhook.ts        # Webhook dispatcher
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   └── utils/
│       ├── logger.ts         # Pino logger
│       └── helpers.ts        # Utility functions
├── sessions/                 # Session data storage
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm atau yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd whatsapp-bre-x

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run development
npm run dev
```

### Environment Variables

```env
# Server
PORT=3000
HOST=0.0.0.0

# API
API_KEY=your-secret-api-key

# Webhook
WEBHOOK_URL=https://your-webhook-endpoint.com
WEBHOOK_SECRET=your-webhook-secret

# Session
SESSION_DIR=./sessions
```

## 📚 API Documentation

### Session Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | List all sessions |
| POST | `/api/sessions` | Create new session |
| GET | `/api/sessions/:id` | Get session info |
| GET | `/api/sessions/:id/qr` | Get QR code |
| DELETE | `/api/sessions/:id` | Delete session |
| POST | `/api/sessions/:id/logout` | Logout session |

### Messaging

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/messages/send` | Send text message |
| POST | `/api/messages/send-media` | Send media message |
| POST | `/api/messages/send-template` | Send template message |
| GET | `/api/messages/:id` | Get message status |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chats` | Get all chats |
| GET | `/api/chats/:jid` | Get chat by JID |
| GET | `/api/chats/:jid/messages` | Get chat messages |

## 📦 Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## 🔔 Webhook Events

Events yang dikirim ke webhook endpoint:

- `session.connected` - Session berhasil terkoneksi
- `session.disconnected` - Session terputus
- `session.qr` - QR code update
- `message.received` - Pesan masuk
- `message.sent` - Pesan terkirim
- `message.delivered` - Pesan terdelivery
- `message.read` - Pesan dibaca

### Webhook Payload

```json
{
  "event": "message.received",
  "sessionId": "session-1",
  "timestamp": "2024-12-17T08:00:00.000Z",
  "data": { ... }
}
```

## 🔒 Authentication

Semua API endpoint memerlukan header `Authorization`:

```
Authorization: Bearer <API_KEY>
```

## 📝 Scripts

```bash
# Development dengan hot reload
npm run dev

# Build production
npm run build

# Run production
npm start

# Lint check
npm run lint

# Lint fix
npm run lint:fix
```

## 📄 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines first.

## ⚠️ Disclaimer

Project ini tidak terafiliasi dengan WhatsApp Inc. Gunakan dengan bijak dan sesuai dengan Terms of Service WhatsApp.
