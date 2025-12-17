import { Boom } from '@hapi/boom'
import NodeCache from '@cacheable/node-cache'
import makeWASocket, { proto, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, useMultiFileAuthState, CacheStore, DisconnectReason } from '@whiskeysockets/baileys'
import { createBaileysLogger, createSessionLogger, Logger } from '../../config/logger.js'
import { whatsappHandler } from './handler.js'
import * as QRCode from 'qrcode'
import { SocketService } from '../../config/socket.js'

export class whatsappConnection {
    private authFolder: string
    private sessionId: string
    private sessionName: string
    private whatsappId: string
    private sock: any
    private msgRetryCounterCache: CacheStore
    private logger: Logger
    private baileysLogger: Logger
    private handler: whatsappHandler
    private socketService: SocketService
    private maxRetry = 3
    private retryCount = 0

    constructor(authFolder: string, sessionId: string, sessionName: string, whatsappId: string) {
        this.authFolder = authFolder
        this.sessionId = sessionId
        this.whatsappId = whatsappId
        this.sessionName = sessionName

        this.msgRetryCounterCache = new NodeCache() as CacheStore

        this.logger = createSessionLogger(this.sessionName)

        this.baileysLogger = createBaileysLogger({ sessionName: this.sessionName, level: 'warn' })

        this.socketService = SocketService.getInstance()

        this.handler = new whatsappHandler(this.sessionId, this.whatsappId, this.socketService)
    }

    private async startConnection() {
        try {
            const { state, saveCreds } = await useMultiFileAuthState(this.authFolder)
            const { version } = await fetchLatestBaileysVersion()

            this.logger.info({ version }, 'Starting WhatsApp connection')

            this.sock = makeWASocket({
                version,
                logger: this.baileysLogger,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, this.baileysLogger)
                },
                msgRetryCounterCache: this.msgRetryCounterCache
            })

            this.sock.ev.process(
                async (events: any) => {
                    if (events['connection.update']) {
                        const update = events['connection.update']
                        const { connection, lastDisconnect, qr } = update
                        if (qr) {
                            const qrCodeBase64 = await QRCode.toDataURL(qr.data, {
                                margin: 1,
                                color: {
                                    dark: '#000000',
                                    light: '#FFFFFF'
                                }
                            })

                            const base64String = qrCodeBase64.split(',')[1]

                            if (base64String) {
                                this.socketService.emitQRCode(this.sessionId, this.whatsappId, base64String)
                            }
                        }

                        if (connection === 'open') {
                            this.retryCount = 0
                            const remoteJid = this.sock.user!.id
                            const phoneNumber = remoteJid.includes(':')
                                ? remoteJid.split(':')[0]
                                : remoteJid.includes('@')
                                    ? remoteJid.split('@')[0]
                                    : remoteJid
                            const myProfile = this.sock.authState.creds.me
                            const myName = myProfile.name
                            this.socketService.emitConnectionStatus(
                                this.sessionId,
                                this.whatsappId,
                                this.sock,
                                'authenticated',
                                {
                                    remoteJid,
                                    phoneNumber,
                                    myName
                                }
                            )
                        }

                        if (connection === 'connecting') {
                            this.socketService.emitConnectionStatus(
                                this.sessionId,
                                this.whatsappId,
                                this.sock,
                                'connecting'
                            )
                        }

                        if (connection === 'close') {
                            const statusCode = (update.lastDisconnect?.error as Boom)?.output?.statusCode

                            const permanentDisconnectReason = [
                                DisconnectReason.loggedOut,
                                DisconnectReason.badSession,
                                DisconnectReason.multideviceMismatch
                            ]

                            const temporaryDisconnectReason = [
                                DisconnectReason.connectionClosed,
                                DisconnectReason.connectionLost,
                                DisconnectReason.connectionReplaced,
                                DisconnectReason.restartRequired,
                                DisconnectReason.unavailableService
                            ]

                            const isPermanentDisconnect = permanentDisconnectReason.includes(statusCode)
                            const isTemporaryDisconnect = temporaryDisconnectReason.includes(statusCode)

                            if (isPermanentDisconnect) {
                                this.logger.info({ statusCode }, 'Permanent disconnect')
                                this.socketService.emitConnectionStatus(
                                    this.sessionId,
                                    this.whatsappId,
                                    this.sock,
                                    'logged_out'
                                )
                            }

                            let delay

                            if (isTemporaryDisconnect) {
                                this.retryCount++

                                if (this.retryCount > this.maxRetry) {
                                    this.logger.info({ statusCode }, 'Temporary disconnect')
                                    this.socketService.emitConnectionStatus(
                                        this.sessionId,
                                        this.whatsappId,
                                        this.sock,
                                        'error',
                                        {
                                            message: 'Max retry exceeded'
                                        }
                                    )
                                }

                                this.logger.info({ statusCode }, 'Temporary disconnect')
                                this.socketService.emitConnectionStatus(
                                    this.sessionId,
                                    this.whatsappId,
                                    this.sock,
                                    'connecting'
                                )

                                delay = 3000

                                setTimeout(() => {
                                    this.startConnection()
                                }, delay)
                            }
                        }
                    }

                    if (events['creds.update']) {
                        await saveCreds()
                        this.logger.debug('Credentials updated')
                    }

                    if (events['label.association']) {
                        this.logger.debug({ labelAssociation: events['label.association'] }, 'Label association event')
                    }

                    if (events['label.edit']) {
                        this.logger.debug({ labelEdit: events['label.edit'] }, 'Label edit event')
                    }

                    if (events['call']) {
                        this.logger.info({ call: events['call'] }, 'Call event received')
                    }

                    // history received
                    if (events['messaging-history.set']) {
                        const { chats, contacts, messages, isLatest, progress, syncType } = events['messaging-history.set']
                        if (syncType === proto.HistorySync.HistorySyncType.ON_DEMAND) {
                            this.logger.info({ syncType }, 'History sync type: ON_DEMAND')
                        }
                        if (syncType === proto.HistorySync.HistorySyncType.RECENT) {
                            this.logger.info({ syncType }, 'History sync type: RECENT')
                        }
                        if (syncType === proto.HistorySync.HistorySyncType.FULL) {
                            this.logger.info({ syncType }, 'History sync type: FULL')
                        }
                    }

                    // received a new message
                    if (events['messages.upsert']) {
                        const upsert = events['messages.upsert']
                        if (upsert.type === 'notify') {
                            this.handler.handleMessagesNotify(upsert.messages)
                        }
                        if (upsert.type === 'append') {
                            this.handler.handleMessagesAppend(upsert.messages)
                        }
                    }

                    // message updated
                    if (events['messages.update']) {
                        const update = events['messages.update']
                        this.handler.handleMessagesUpdate(update)
                    }

                    // contact upsert
                    if (events['contacts.upsert']) {
                        const upsert = events['contacts.upsert']
                        this.handler.handleContactsUpsert(upsert)
                    }

                    // contact update
                    if (events['contacts.update']) {
                        const update = events['contacts.update']
                        this.handler.handleContactsUpdate(update)
                    }
                }
            )

        } catch (error) {
            this.logger.error({ error }, 'Failed to start WhatsApp connection')
        }
    }
}