import { proto, Contact, WAMessageUpdate } from '@whiskeysockets/baileys'
import { Logger } from '../../config/logger.js'
import { createSessionLogger } from '../../config/logger.js'
import { SocketService } from '../../config/socket.js'
import { ensureContactAndSaveMessage } from './helper.js'

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

    // new message, can integrate to chatwoot or view front end
    public async handleMessagesNotify(messages: proto.IWebMessageInfo) {
        this.logger.debug({ messages }, 'Messages notify')
        const saveContactAndMessage = await ensureContactAndSaveMessage(this.sessionId, messages)
        this.socketService.emit('message', saveContactAndMessage)
    }

    // old message only save message
    public async handleMessagesAppend(messages: proto.IWebMessageInfo) {
        this.logger.debug({ messages }, 'Messages append')
        await ensureContactAndSaveMessage(this.sessionId, messages)
    }

    // update message
    public async handleMessagesUpdate(update: WAMessageUpdate) {
        this.logger.debug({ update }, 'Messages update')
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