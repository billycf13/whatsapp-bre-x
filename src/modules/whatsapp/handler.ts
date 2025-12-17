import { proto, Contact } from '@whiskeysockets/baileys'
import { Logger } from '../../config/logger.js'
import { createSessionLogger } from '../../config/logger.js'
import { SocketService } from '../../config/socket.js'

export class whatsappHandler {
    private logger: Logger
    private sessionId: string
    private whatsappId: string
    private socketService: SocketService

    constructor(sessionId: string, whatsappId: string, socketService: SocketService) {
        this.logger = createSessionLogger(sessionId)
        this.sessionId = sessionId
        this.whatsappId = whatsappId
        this.socketService = socketService
    }

    // new message
    public handleMessagesNotify(messages: proto.IMessage[]) {
        this.logger.debug({ messages }, 'Messages notify')
    }

    // old message
    public handleMessagesAppend(messages: proto.IMessage[]) {
        this.logger.debug({ messages }, 'Messages append')
    }

    // update message
    public handleMessagesUpdate(messages: proto.IMessage[]) {
        this.logger.debug({ messages }, 'Messages update')
    }

    // contact upsert (new contacts)
    public handleContactsUpsert(contacts: Contact[]) {
        this.logger.debug({ contacts }, 'Contacts upsert')
    }
    // contact update
    public handleContactsUpdate(contacts: Partial<Contact>[]) {
        this.logger.debug({ contacts }, 'Contacts update')
    }
}