import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { EventEmitter } from 'events'
import { whatsappConnection } from '@/modules/whatsapp/connection.js'

export interface WhatsAppConnectionEvent {
    sessionId: string
    whatsappId: string
    sock: whatsappConnection
    event: 'authenticated' | 'logged_out' | 'error' | 'connecting'
    data?: any
}

export interface WhatsAppPairingEvent {
    sessionId: string
    whatsappId: string
    event: 'qr_code' | 'pairing_code'
    data?: any
}

export interface WhatsAppMessageEvent {
    sessionId: string
    whatsappId: string
    event: 'message_received' | 'message_updated'
    data?: any
}

export class SocketService extends EventEmitter {
    private io: SocketIOServer
    private static instance: SocketService

    constructor(server: HTTPServer) {
        super()
        this.io = new SocketIOServer(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        })

        this.setupEventHandlers()
    }

    /**
     * Mendapatkan instance singleton
     */
    public static getInstance(server?: HTTPServer): SocketService {
        if (!SocketService.instance && server) {
            SocketService.instance = new SocketService(server)
        }
        return SocketService.instance
    }

    /**
     * Setup event handlers untuk Socket.IO
     */
    private setupEventHandlers(): void {
        this.io.on('connection', (socket) => {

            // Client bergabung ke room sesi tertentu
            socket.on('join_session', (sessionId: string) => {
                socket.join(`session_${sessionId}`)

                socket.emit('joined_session', {
                    success: true,
                    sessionId,
                    message: `Berhasil bergabung ke sesi ${sessionId}`
                })
            })

            // Client keluar dari room sesi
            socket.on('leave_session', (sessionId: string) => {
                socket.leave(`session_${sessionId}`)
            })

            // Handle disconnect
            socket.on('disconnect', () => {
                // Logika saat client terputus (jika diperlukan)
            })
        })
    }

    /**
     * Mengirim event ke sesi WhatsApp tertentu
     */
    public emitToSession(sessionId: string, event: WhatsAppConnectionEvent | WhatsAppPairingEvent): void {
        this.io.to(`session_${sessionId}`).emit('whatsapp_event', event)
    }

    /**
     * Mengirim QR code ke sesi tertentu
     */
    public emitQRCode(sessionId: string, whatsappId: string, qrCode: string): void {
        const event: WhatsAppPairingEvent = {
            sessionId,
            whatsappId,
            event: 'qr_code',
            data: { qrCode }
        }
        this.emitToSession(sessionId, event)
    }

    /**
     * Mengirim pairing code ke sesi tertentu
     */
    public emitPairingCode(sessionId: string, whatsappId: string, pairingCode: string): void {
        const event: WhatsAppPairingEvent = {
            sessionId,
            whatsappId,
            event: 'pairing_code',
            data: { pairingCode }
        }
        this.emitToSession(sessionId, event)
    }

    /**
     * Mengirim status koneksi ke sesi tertentu
     */
    public emitConnectionStatus(sessionId: string, whatsappId: string, sock: whatsappConnection, status: 'connecting' | 'authenticated' | 'logged_out' | 'error', data?: any): void {
        const event: WhatsAppConnectionEvent = {
            sessionId,
            whatsappId,
            sock,
            event: status,
            data
        }
        this.emit('connection_status', event)
        this.emitToSession(sessionId, event)
    }

    /**
     * Mendapatkan Socket.IO server instance
     */
    public getIO(): SocketIOServer {
        return this.io
    }
}

export default SocketService