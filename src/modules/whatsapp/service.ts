import { WhatsAppConnection } from './connection.js'
import { SocketService, WhatsAppConnectionEvent } from '../../config/socket.js'
import { WhatsAppModel } from './model.js'
import { createAuthFolder, deleteAuthFolder, cleanupAuthFolder } from './helper.js'
import dotenv from 'dotenv'
import { WAMessage } from '@whiskeysockets/baileys'
dotenv.config()
import path from 'path'
import fs from 'fs'
export class WhatsAppService {
    private static instance: WhatsAppService
    private connection: Map<string, WhatsAppConnection>
    private connectionLock: Set<string>
    private socketService: SocketService
    private whatsappModel: WhatsAppModel
    private SESSION_DIR: string

    constructor() {
        this.connection = new Map()
        this.connectionLock = new Set()
        this.socketService = SocketService.getInstance()
        this.whatsappModel = new WhatsAppModel()
        this.SESSION_DIR = path.join(process.cwd(), process.env.SESSION_DIR || './sessions')
        this.ensureSessionDir()
        this.setupEventListeners()
    }

    static getInstance(): WhatsAppService {
        if (!WhatsAppService.instance) {
            WhatsAppService.instance = new WhatsAppService()
        }
        return WhatsAppService.instance
    }

    private ensureSessionDir() {
        try {
            if (!fs.existsSync(this.SESSION_DIR)) {
                fs.mkdirSync(this.SESSION_DIR)
            }
        } catch (error) {
            console.error('Failed to create session directory:', error)
        }
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

    createConnection = async (whatsappId: string, sessionName: string) => {
        if (this.connection.has(whatsappId)) {
            return this.connection.get(whatsappId)
        }

        if (this.connectionLock.has(whatsappId)) {
            return
        }

        this.connectionLock.add(whatsappId)


    }

    closeConnection = async (whatsappId: string) => {
        const connecting = this.connection.get(whatsappId)
        if (!connecting) {
            return
        }

        try {
            await connecting.logout()
            this.connection.delete(whatsappId)
        } catch (error) {
            this.connection.delete(whatsappId)
        }
    }

    cancelConnection = async (whatsappId: string) => {
        this.connectionLock.delete(whatsappId)
    }

    getValidSession = async () => {

    }

    autoConnect = async () => { }

    getJidFromLid = async (whatsappId: string, lid: string) => {
        const connection = this.connection.get(whatsappId)
        if (!connection) {
            return
        }

        const jid = connection.decodeJid(lid)
        return jid ?? null
    }

    sendMessage = async (
        whatsappId: string,
        remoteJid: string,
        options: {
            text?: string
            attachments?: {
                url: string
                type: 'image' | 'video' | 'audio' | 'file'
                caption?: string | undefined
                fileName?: string
                mimeType?: string
            }[]
            quoted?: WAMessage
        }
    ): Promise<WAMessage[]> => {
        const connection = this.connection.get(whatsappId)
        if (!connection) {
            return []
        }

        const results: WAMessage[] = []

        if (options.text && (!options.attachments || options.attachments.length === 0)) {
            const msg = await connection.socket.sendMessage(
                remoteJid,
                { text: options.text },
                options.quoted
                    ? { quoted: options.quoted }
                    : {}
            )

            if (msg) results.push(msg)
        }

        if (options.attachments && options.attachments.length > 0) {
            for (const [i, file] of options.attachments.entries()) {
                const caption = file.caption || (i === 0 ? options.text : undefined)

                if (caption) {
                    const msg = await connection.socket.sendMessage(
                        remoteJid,
                        { text: caption },
                        options.quoted
                            ? { quoted: options.quoted }
                            : {}
                    )
                    if (msg) results.push(msg)
                }

                const payload: any = {}

                if (file.type === 'image') {
                    payload.image = { url: file.url }
                }

                if (file.type === 'video') {
                    payload.video = { url: file.url }
                }

                if (file.type === 'audio') {
                    payload.audio = { url: file.url }
                    payload.fileName = file.mimeType || 'audio/mpeg'
                }

                if (file.type === 'file') {
                    payload.document = { url: file.url }
                    payload.fileName = file.fileName || file.url.split('/').pop() || 'file'
                }

                const msg = await connection.socket.sendMessage(
                    remoteJid,
                    payload,
                    options.quoted
                        ? { quoted: options.quoted }
                        : {}
                )

                if (msg) results.push(msg)
            }
        }

        return results
    }

}