import { whatsappConnection } from './connection.js'
import { SocketService, WhatsAppConnectionEvent } from '../../config/socket.js'
import { whatsappModel } from './model.js'
import dotenv from 'dotenv'
dotenv.config()

export class whatsappService {
    private static instance: whatsappService
    private connection: Map<string, whatsappConnection>
    private connectionLock: Set<string>
    private socketService: SocketService
    private whatsappModel: whatsappModel

    constructor() {
        this.connection = new Map()
        this.connectionLock = new Set()
        this.socketService = SocketService.getInstance()
        this.whatsappModel = new whatsappModel()

        this.setupEventListeners()
    }

    getInstance = () => {
        if (!whatsappService.instance) {
            whatsappService.instance = new whatsappService()
        }
        return whatsappService.instance
    }

    private setupEventListeners() {
        this.socketService.on('connection_status', (event: WhatsAppConnectionEvent) => {
            if (event.event === 'authenticated') {
                this.connection.set(event.whatsappId, event.sock)
            }
            if (event.event === 'logged_out') {
                this.connection.delete(event.whatsappId)
            }
            if (event.event === 'error') {
                this.connection.delete(event.whatsappId)
            }
            if (event.event === 'connecting') {
                this.connectionLock.add(event.whatsappId)
            }
        })
    }

    createConnection = (whatsappId: string, sessionName: string) => {
        if (this.connection.has(whatsappId)) {
            return this.connection.get(whatsappId)
        }

        if (this.connectionLock.has(whatsappId)) {
            return
        }

        this.connectionLock.add(whatsappId)


    }

}