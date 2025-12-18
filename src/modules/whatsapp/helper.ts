import path from 'path'
import fs from 'fs'
import Long from 'long'
import { proto, WAMessageStatus } from '@whiskeysockets/baileys'
import { WhatsAppService } from './service.js'
import { WhatsAppModel } from './model.js'

export function getAuthFolder(sessionDir: string, whatsappId: string) {
    if (!whatsappId) return ''

    return path.join(sessionDir, whatsappId)
}

export function createAuthFolder(sessionDir: string, whatsappId: string) {
    if (!whatsappId) return ''

    const authFolder = getAuthFolder(sessionDir, whatsappId)
    if (!fs.existsSync(authFolder)) {
        fs.mkdirSync(authFolder, { recursive: true })
    }
}

export function deleteAuthFolder(sessionDir: string, whatsappId: string) {
    if (!whatsappId) return ''

    const authFolder = getAuthFolder(sessionDir, whatsappId)
    if (fs.existsSync(authFolder)) {
        fs.rmSync(authFolder, { recursive: true })
    }
}

export function cleanupAuthFolder(sessionDir: string) {
    try {
        const sessionDirs = fs.readdirSync(sessionDir)
        for (const sessionDir of sessionDirs) {
            const sessionPath = path.join(sessionDir, sessionDir)

            if (!fs.statSync(sessionPath).isDirectory()) continue

            deleteAuthFolder(sessionDir, sessionDir)
        }
    } catch (error) {
        return
    }
}

export async function getJidFromLid(whatsappId: string, lid: string): Promise<string> {
    const whatsappService = WhatsAppService.getInstance()
    const jid = await whatsappService.getJidFromLid(whatsappId, lid)
    return jid || ''
}

export async function normalizeJid(whatsappId: string, remoteJid: string) {
    let jid = remoteJid
    if (jid.includes('@lid')) {
        jid = await getJidFromLid(whatsappId, jid)
    }

    if (jid.includes(':')) {
        jid = jid.split(':')[0] + '@s.whatsapp.net'
    }

    return jid
}

export async function normalizePhone(jid: string | null) {
    if (!jid) return ''

    let phone = jid.split('@')[0]

    if (phone!.includes(':')) {
        phone = phone!.split(':')[0]
    }

    if (phone!.startsWith('0')) {
        phone = '+62' + phone!.substring(1)
    }

    if (phone!.startsWith('62')) {
        phone = '+' + phone!
    }


    return phone
}

export function convertTimestamp(ts: number | Long | null | undefined): Date {
    if (!ts) return new Date()

    const num = typeof ts === 'number'
        ? ts
        : ts.toNumber()

    return new Date(num * 1000)
}

export function skipMessage(message: proto.IWebMessageInfo): boolean {
    if (!message.key || !message.key.remoteJid) return true

    const key = message.key
    const remoteJid = key!.remoteJid!
    const msg = message!.message!

    // pesan group
    if (remoteJid.includes('@g.us')) return true

    // pesan broadcast/status
    if (remoteJid.includes('status@broadcast')) return true

    // pesan protocol
    if (msg.protocolMessage) return true

    // pesan ephemeral/disappering
    if (msg.ephemeralMessage) return true

    // call
    if (msg.call) return true

    return false
}

export function processMessage(message: proto.IWebMessageInfo) {

    let msg = message!.message!

    // ViewOnce messages (gambar/video sekali lihat)
    if (msg.viewOnceMessage?.message) {
        msg = msg.viewOnceMessage.message
    }

    // Ephemeral messages (pesan sementara)
    if (msg.ephemeralMessage?.message) {
        msg = msg.ephemeralMessage.message
    }

    // Document with caption
    if (msg.documentWithCaptionMessage?.message) {
        msg = msg.documentWithCaptionMessage.message
    }

    // 1. CONVERSATION (text biasa)
    if (msg.conversation) {
        return {
            content: msg.conversation,
            mediaUrl: '',
            metaData: {},
            contentType: 'text',
            mimeType: '',
            fileName: ''
        }
    }

    // 2. EXTENDED TEXT (text dengan link preview, dll)
    if (msg.extendedTextMessage?.text) {
        return {
            content: msg.extendedTextMessage.text,
            mediaUrl: '',
            metaData: msg.extendedTextMessage,
            contentType: 'text',
            mimeType: '',
            fileName: ''
        }
    }

    const defaultFileName = new Date().toISOString()

    // 3. IMAGE
    if (msg.imageMessage) {
        return {
            content: msg.imageMessage.caption || '',
            mediaUrl: msg.imageMessage.url || '',
            metaData: msg.imageMessage,
            contentType: 'image',
            mimeType: msg.imageMessage.mimetype || 'image/jpeg',
            fileName: `image-${defaultFileName}.${msg.imageMessage.mimetype?.split('/')[1] || 'jpg'}`
        }
    }

    // 4. VIDEO
    if (msg.videoMessage) {
        return {
            content: msg.videoMessage.caption || '',
            mediaUrl: msg.videoMessage.url || '',
            metaData: msg.videoMessage,
            contentType: 'video',
            mimeType: msg.videoMessage.mimetype || 'video/mp4',
            fileName: `video-${defaultFileName}.${msg.videoMessage.mimetype?.split('/')[1] || 'mp4'}`
        }
    }

    // 5. DOCUMENT
    if (msg.documentMessage) {
        return {
            content: msg.documentMessage.caption || '',
            mediaUrl: msg.documentMessage.url || '',
            metaData: msg.documentMessage,
            contentType: 'document',
            mimeType: msg.documentMessage.mimetype || 'application/octet-stream',
            fileName: msg.documentMessage.fileName || 'document'
        }
    }

    // 6. AUDIO (termasuk voice note)
    if (msg.audioMessage) {
        const isVoice = msg.audioMessage.ptt || false
        return {
            content: isVoice ? 'voice note' : 'audio',
            mediaUrl: msg.audioMessage.url || '',
            metaData: msg.audioMessage,
            contentType: isVoice ? 'voice' : 'audio',
            mimeType: msg.audioMessage.mimetype || 'audio/ogg',
            fileName: (isVoice ? `voice-${defaultFileName}.ogg` : `audio-${defaultFileName}.mp3`)
        }
    }

    // 7. STICKER
    if (msg.stickerMessage) {
        return {
            content: 'sticker',
            mediaUrl: msg.stickerMessage.url || '',
            metaData: msg.stickerMessage,
            contentType: 'sticker',
            mimeType: msg.stickerMessage.mimetype || 'image/webp',
            fileName: `sticker-${defaultFileName}.webp`
        }
    }

    // 8. REACTION
    if (msg.reactionMessage) {
        return {
            content: msg.reactionMessage.text || '👍',
            mediaUrl: '',
            metaData: msg.reactionMessage,
            contentType: 'reaction',
            mimeType: '',
            fileName: ''
        }
    }

    // 9. LOCATION
    if (msg.locationMessage) {
        const lat = msg.locationMessage.degreesLatitude
        const lon = msg.locationMessage.degreesLongitude
        const name = msg.locationMessage.name
        const address = msg.locationMessage.address

        return {
            content: name || address || `Lokasi: ${lat}, ${lon}`,
            mediaUrl: '',
            metaData: msg.locationMessage,
            contentType: 'location',
            mimeType: '',
            fileName: ''
        }
    }

    // 10. CONTACT
    if (msg.contactMessage) {
        const displayName = msg.contactMessage.displayName || 'Kontak'
        const vcard = msg.contactMessage.vcard

        return {
            content: `Kontak: ${displayName}`,
            mediaUrl: '',
            metaData: msg.contactMessage,
            contentType: 'contact',
            mimeType: 'text/vcard',
            fileName: `${displayName}-${defaultFileName}.vcf`
        }
    }

    // 11. CONTACTS (multiple)
    if (msg.contactsArrayMessage) {
        const count = msg.contactsArrayMessage.contacts?.length || 0

        return {
            content: `${count} Kontak`,
            mediaUrl: '',
            metaData: msg.contactsArrayMessage,
            contentType: 'contact',
            mimeType: 'text/vcard',
            fileName: `contacts-${defaultFileName}.vcf`
        }
    }

    // 12. POLL (voting)
    if (msg.pollCreationMessage) {
        const question = msg.pollCreationMessage.name || 'Poll'

        return {
            content: question,
            mediaUrl: '',
            metaData: msg.pollCreationMessage,
            contentType: 'poll',
            mimeType: '',
            fileName: ''
        }
    }

    // 13. LIVE LOCATION
    if (msg.liveLocationMessage) {
        const lat = msg.liveLocationMessage.degreesLatitude
        const lon = msg.liveLocationMessage.degreesLongitude

        return {
            content: `Live Location: ${lat}, ${lon}`,
            mediaUrl: '',
            metaData: msg.liveLocationMessage,
            contentType: 'location',
            mimeType: '',
            fileName: ''
        }
    }

    // 14. BUTTONS MESSAGE
    if (msg.buttonsMessage) {
        const text = msg.buttonsMessage.contentText ||
            msg.buttonsMessage.footerText ||
            'Button Message'

        return {
            content: text,
            mediaUrl: '',
            metaData: msg.buttonsMessage,
            contentType: 'buttons',
            mimeType: '',
            fileName: ''
        }
    }

    // 15. TEMPLATE MESSAGE
    if (msg.templateMessage) {
        const text = msg.templateMessage.hydratedTemplate?.hydratedContentText ||
            'Template Message'

        return {
            content: text,
            mediaUrl: '',
            metaData: msg.templateMessage,
            contentType: 'template',
            mimeType: '',
            fileName: ''
        }
    }

    // 16. LIST MESSAGE
    if (msg.listMessage) {
        const text = msg.listMessage.description ||
            msg.listMessage.title ||
            'List Message'

        return {
            content: text,
            mediaUrl: '',
            metaData: msg.listMessage,
            contentType: 'list',
            mimeType: '',
            fileName: ''
        }
    }

    return {
        content: '',
        mediaUrl: '',
        metaData: msg,
        contentType: 'unknown',
        mimeType: '',
        fileName: ''
    }
}

export async function ensureContactAndSaveMessage(
    sessionId: string,
    messages: proto.IWebMessageInfo
) {
    if (skipMessage(messages)) return

    const whatsappModel = new WhatsAppModel()
    const key = messages.key!
    const remoteJid = key.remoteJid!
    const fromMe = key.fromMe!
    const messageId = key.id!
    const jid = await normalizeJid(sessionId, remoteJid)
    const phone = await normalizePhone(jid)
    const pushName = messages.pushName || messages.verifiedBizName || phone || ''

    const msg = processMessage(messages)

    // saving contact if not exists
    let contact = await whatsappModel.getContact(remoteJid, sessionId)
    if (!contact) {
        const profilePicture = ''
        const lastSeen = new Date()
        const lastMessage = msg.content !== '' || null || undefined
            ? msg.content
            : msg.contentType
        const lastMessageTimestamp = convertTimestamp(messages.messageTimestamp)
        contact = await whatsappModel.createContact(
            sessionId,
            pushName,
            phone,
            remoteJid,
            fromMe
                ? 0
                : 1,
            profilePicture,
            lastSeen,
            lastMessage,
            lastMessageTimestamp,
            fromMe
        )
    }

    // saving message
    const saveMessage = await whatsappModel.createMessage(
        contact.id,
        msg.contentType,
        fromMe,
        2,
        convertTimestamp(messages.messageTimestamp),
        messageId,
        key,
        messages.message?.reactionMessage?.key?.id || '',
        messages.message?.extendedTextMessage?.contextInfo?.stanzaId || '',
        msg.mediaUrl,
        msg.metaData,
        msg.content,
    )

    return {
        contact,
        saveMessage
    }
}
