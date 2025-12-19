import axios, { AxiosInstance } from 'axios'
import FormData, { AppendOptions } from 'form-data'
import { downloadMediaMessage, WAMessage } from '@whiskeysockets/baileys'
import { Logger, createSessionLogger } from '@/config/logger.js'


export class ChatwootService {
    private axiosInstance: AxiosInstance
    private logger: Logger
    private account_id: number
    constructor(
        baseUrl: string,
        token: string,
        account_id: number
    ) {
        this.axiosInstance = axios.create({
            baseURL: baseUrl,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        this.logger = createSessionLogger('ChatwootService')
        this.account_id = account_id
    }

    getAllListInbox = async () => {
        try {
            const response = await this.axiosInstance.get(`/api/v1/accounts/${this.account_id}/inboxes`)
            return {
                success: true,
                data: response.data.payload.map((inbox: any) => ({
                    id: inbox.id,
                    name: inbox.name,
                    channel_type: inbox.channel_type,
                    inbox_identifier: inbox.inbox_identifier,
                    webhook_url: inbox.webhook_url
                }))
            }
        } catch (error: any) {
            this.logger.error('Failed to get all list inbox:', error)
            return {
                success: false,
                error
            }
        }
    }

    createInbox = async (
        name: string,
        webhook_url: string
    ) => {
        try {
            const response = await this.axiosInstance.post(`api/v1/accounts/${this.account_id}/inboxes`, {
                name,
                channel: {
                    type: 'api',
                    webhook_url
                }
            })
            return {
                success: true,
                data: {
                    id: response.data.payload.id,
                    name: response.data.payload.name,
                    channel_type: response.data.payload.channel_type,
                    inbox_identifier: response.data.payload.inbox_identifier,
                    webhook_url: response.data.payload.webhook_url
                }
            }
        } catch (error: any) {
            this.logger.error('Failed to create inbox:', error)
            return {
                success: false,
                error
            }
        }
    }

    updateWebhookUrl = async (
        inbox_id: string,
        webhook_url: string
    ) => {
        try {
            const response = await this.axiosInstance.put(`api/v1/accounts/${this.account_id}/inboxes/${inbox_id}`, {
                channel: {
                    webhook_url
                }
            })
            return {
                success: true,
                data: {
                    id: response.data.payload.id,
                    name: response.data.payload.name,
                    channel_type: response.data.payload.channel_type,
                    inbox_identifier: response.data.payload.inbox_identifier,
                    webhook_url: response.data.payload.webhook_url
                }
            }
        } catch (error: any) {
            this.logger.error('Failed to update webhook url:', error)
            return {
                success: false,
                error
            }
        }
    }

    checkContactExists = async (
        identifier: string,
        phoneNumber: string
    ) => {
        try {
            let phone = phoneNumber
            let jid = identifier

            // jika jid ada kata : atau @lid maka jangan lakukan search
            if (jid.includes(':') || jid.includes('@lid')) {
                jid = ''
            }

            // jika phone number diawali dengan +, maka dihilangkan +
            if (phoneNumber.startsWith('+')) {
                phone = phoneNumber.slice(1)
            }

            let searchResult: any

            // first check with identifier
            searchResult = await this.axiosInstance.get(`api/v1/accounts/${this.account_id}/contacts/search?page=1&q=${jid}`)

            // jika cek dengan identifier tidak ditemukan, coba lakukan search dengan phone number
            if (searchResult.data.payload.length === 0) {
                searchResult = await this.axiosInstance.get(`api/v1/accounts/${this.account_id}/contacts/search?page=1&q=${phone}`)
            }

            const contactExist = searchResult.data.payload.find(
                (contact: any) => contact.identifier === jid || contact.phone_number === phone
            )

            if (!contactExist) {
                this.logger.info(`Contact ${identifier} or ${phone} not found on chatwoot`)
                return {
                    success: true,
                    exists: !!contactExist,
                    data: null
                }
            }

            this.logger.info(`Contact ${identifier} or ${phone} found on chatwoot`)
            return {
                success: true,
                exists: !!contactExist,
                data: contactExist ? {
                    id: contactExist.id as number,
                    identifier: contactExist.identifier as string,
                    name: contactExist.name as string,
                    phoneNumber: contactExist.phone_number as string,
                    email: contactExist.email as string,
                } : null
            }
        } catch (error: any) {
            this.logger.error(`Failed to check contact exists: ${identifier} ${phoneNumber}\n`, error?.response?.data || error)
            return {
                success: false,
                error
            }
        }
    }

    createContact = async (
        inbox_id: number,
        name: string,
        identifier: string,
        phone_number: string
    ) => {
        try {
            const response = await this.axiosInstance.post(`api/v1/accounts/${this.account_id}/contacts`, {
                inbox_id,
                name,
                identifier,
                phone_number
            })
            return {
                success: true,
                data: {
                    id: response.data.payload.id
                }
            }
        } catch (error: any) {
            this.logger.error(`Failed to create contact: ${inbox_id} ${name} ${identifier} ${phone_number} \n`, error?.response?.data || error)
            return {
                success: false,
                error
            }
        }
    }

    updateContactName = async (
        contact_id: string,
        name: string
    ) => {
        try {
            const response = await this.axiosInstance.put(`api/v1/accounts/${this.account_id}/contacts/${contact_id}`, {
                name
            })
            return {
                success: true,
                data: {
                    id: response.data.payload.id
                }
            }
        } catch (error: any) {
            this.logger.error('Failed to update contact name:', error)
            return {
                success: false,
                error
            }
        }
    }

    checkConversationExists = async (
        inbox_id: string,
        contact_id: string,
    ) => {
        try {
            const response = await this.axiosInstance.get(`api/v1/accounts/${this.account_id}/contacts/${contact_id}/conversations`)

            if (response.data.payload.length === 0) {
                return {
                    success: true,
                    exists: false,
                    data: null
                }
            }

            const inboxConversations = response.data.payload.filter(
                (c: any) => c.inbox_id === inbox_id
            )

            if (inboxConversations.length === 0) {
                return {
                    success: true,
                    exists: false,
                    data: null
                }
            }

            const latestConversation = inboxConversations[0]

            return {
                success: true,
                exists: true,
                data: {
                    id: latestConversation.id
                }
            }
        } catch (error: any) {
            this.logger.error(`Failed to check conversation exists: ${inbox_id} ${contact_id}\n`, error?.response?.data || error)
            return {
                success: false,
                error
            }
        }
    }

    createConversation = async (
        inbox_id: number,
        source_id: string,
        contact_id: number,
    ) => {
        try {
            const response = await this.axiosInstance.post(`api/v1/accounts/${this.account_id}/conversations`, {
                source_id,
                inbox_id,
                contact_id,
                status: 'open'
            })
            return {
                success: true,
                data: {
                    id: response.data.payload.id
                }
            }
        } catch (error: any) {
            this.logger.error(`Failed to create conversation: ${inbox_id} ${source_id} ${contact_id}\n`, error?.response?.data || error)
            return {
                success: false,
                error
            }
        }
    }

    createMessage = async (
        conversation_id: number,
        content: string,
        content_type: string,
        message_type: string,
        source_id: string,
        rawMessage: WAMessage,
        in_reply_to?: number,
        mediaUrl?: string,
        mimeType?: string,
        fileName?: string,
        reactTo?: number,
    ) => {
        // pesan reaction
        if (reactTo) {
            await this.axiosInstance.post(`api/v1/accounts/${this.account_id}/conversations/${conversation_id}/messages`, {
                content,
                private: true,
                source_id,
                content_attributes: {
                    in_reply_to: reactTo
                }
            })
            return {
                success: true,
                data: {
                    id: -1
                }
            }
        }

        // pesan media
        if (content_type !== 'text' || 'unknown') {
            const form = new FormData()
            form.append('content', content || '')
            form.append('message_type', message_type || 'incoming')
            form.append('source_id', source_id)
            form.append('content_attributes[in_reply_to]', in_reply_to || '')

            const safeFileName = fileName || `file-${Date.now()}.${mimeType?.split('/')[1] || 'bin'}`
            let fileBuffer: Buffer | null = null

            // 1. jika url public (bukan mmg.whatsapp.net), unduh via axios
            if (mediaUrl && mediaUrl.startsWith('http') && !mediaUrl.includes('mmg.whatsapp.net')) {
                const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' })
                fileBuffer = Buffer.from(response.data)
            }

            // 2. jika media whatsapp (private), unduh via baileys
            if (!fileBuffer) {
                fileBuffer = await downloadMediaMessage(rawMessage, 'buffer', {})
            }

            const opts: AppendOptions = {
                filename: safeFileName,
                contentType: mimeType || 'application/octet-stream'
            }

            form.append('attachments[]', fileBuffer, opts)

            const response = await this.axiosInstance.post(
                `api/v1/accounts/${this.account_id}/conversations/${conversation_id}/messages`,
                form,
                {
                    headers: form.getHeaders()
                }
            )

            return {
                success: true,
                data: {
                    id: response.data.id as number
                }
            }
        } else {
            if (!content) content = ''
            // -- teks biasa
            const response = await this.axiosInstance.post(
                `api/v1/accounts/${this.account_id}/conversations/${conversation_id}/messages`,
                {
                    content,
                    content_type,
                    message_type,
                    source_id,
                    content_attributes: { in_reply_to },
                }
            )

            return {
                success: true,
                data: {
                    id: response.data.id as number
                }
            }
        }
    }


}