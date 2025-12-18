import { PrismaClient, ConnectionStatus } from '@prisma/client'
import { getPrismaClient } from '@/config/database.js'

export class WhatsAppModel {
    private prisma: PrismaClient
    constructor() {
        this.prisma = getPrismaClient()
    }
    // CRUD Session
    createSession = async (sessionName: string) => {
        try {
            return await this.prisma.whatsAppSession.create({
                data: {
                    sessionName,
                    status: ConnectionStatus.LOGGED_OUT
                }
            })
        } catch (error) {
            console.error('Failed to create session:', error)
            throw error
        }
    }

    updateSession = async (whatsappId: string, status: ConnectionStatus, lastError?: string, lastActivity?: Date) => {
        try {
            return await this.prisma.whatsAppSession.update({
                where: {
                    id: whatsappId
                },
                data: {
                    status,
                    lastError,
                    lastActivity
                }
            })
        } catch (error) {
            console.error('Failed to update session:', error)
            throw error
        }
    }

    deleteSession = async (whatsappId: string) => {
        try {
            return await this.prisma.whatsAppSession.delete({
                where: {
                    id: whatsappId
                }
            })
        } catch (error) {
            console.error('Failed to delete session:', error)
            throw error
        }
    }

    getSession = async (whatsappId: string) => {
        try {
            return await this.prisma.whatsAppSession.findUnique({
                where: {
                    id: whatsappId
                }
            })
        } catch (error) {
            console.error('Failed to get session:', error)
            throw error
        }
    }

    getAllSessions = async () => {
        try {
            return await this.prisma.whatsAppSession.findMany()
        } catch (error) {
            console.error('Failed to get all sessions:', error)
            throw error
        }
    }

    // CRUD Contact
    createContact = async (
        sessionId: string,
        pushName: string,
        phoneNumber: string,
        remoteJid: string,
        unreadCount: number,
        profilePicture?: string,
        lastSeen?: Date,
        lastMessage?: string,
        lastMessageTime?: Date,
        lastMessageFromMe?: boolean
    ) => {
        try {
            return await this.prisma.whatsAppContact.create({
                data: {
                    sessionId,
                    pushName,
                    phoneNumber,
                    remoteJid,
                    unreadCount,
                    profilePicture,
                    lastSeen,
                    lastMessage,
                    lastMessageTime,
                    lastMessageFromMe
                }
            })
        } catch (error) {
            console.error('Failed to create contact:', error)
            throw error
        }
    }

    updateContact = async (
        sessionId: string,
        remoteJid: string,
        data: {
            pushName?: string,
            phoneNumber?: string,
            unreadCount?: number,
            profilePicture?: string,
            lastSeen?: Date,
            lastMessage?: string,
            lastMessageTime?: Date,
            lastMessageFromMe?: boolean
        }
    ) => {
        try {
            return await this.prisma.whatsAppContact.update({
                where: {
                    remoteJid_sessionId: {
                        remoteJid,
                        sessionId
                    }
                },
                data: {
                    ...data,
                    remoteJid,
                    sessionId
                }
            })
        } catch (error) {
            console.error('Failed to update contact:', error)
            throw error
        }
    }

    deleteContact = async (remoteJid: string, sessionId: string) => {
        try {
            return await this.prisma.whatsAppContact.delete({
                where: {
                    remoteJid_sessionId: {
                        remoteJid,
                        sessionId
                    }
                }
            })
        } catch (error) {
            console.error('Failed to delete contact:', error)
            throw error
        }
    }

    getContact = async (remoteJid: string, sessionId: string) => {
        try {
            return await this.prisma.whatsAppContact.findUnique({
                where: {
                    remoteJid_sessionId: {
                        remoteJid,
                        sessionId
                    }
                }
            })
        } catch (error) {
            console.error('Failed to get contact:', error)
            throw error
        }
    }

    getAllContactSession = async (sessionId: string) => {
        try {
            return await this.prisma.whatsAppContact.findMany({
                where: {
                    sessionId
                }
            })
        } catch (error) {
            console.error('Failed to get all contacts:', error)
            throw error
        }
    }

    getAllContacts = async () => {
        try {
            return await this.prisma.whatsAppContact.findMany({
                include: {
                    session: true
                }
            })
        } catch (error) {
            console.error('Failed to get all contacts:', error)
            throw error
        }
    }

    // CRUD Message
    createMessage = async (
        contactId: string,
        contentType: string,
        fromMe: boolean,
        status: number,
        messageTimestamp: Date,
        messageId: string,
        messageKey: any,
        reactionMessage?: string,
        quotedMessage?: string,
        mediaUrl?: string,
        metaData?: any,
        content?: string,
    ) => {
        try {
            return await this.prisma.whatsAppMessage.create({
                data: {
                    contactId,
                    content,
                    contentType,
                    fromMe,
                    status,
                    messageTimestamp,
                    messageId,
                    messageKey,
                    reactionMessage,
                    quotedMessage,
                    mediaUrl,
                    metaData
                }
            })
        } catch (error) {
            console.error('Failed to create message:', error)
            throw error
        }
    }

    updateMessageStatus = async (
        messageId: string,
        contactId: string,
        status: number
    ) => {
        try {
            return await this.prisma.whatsAppMessage.update({
                where: {
                    messageId_contactId: {
                        messageId,
                        contactId
                    }
                },
                data: {
                    status
                }
            })
        } catch (error) {
            console.error('Failed to update message:', error)
            throw error
        }
    }

    deleteMessage = async (messageId: string, contactId: string) => {
        try {
            return await this.prisma.whatsAppMessage.delete({
                where: {
                    messageId_contactId: {
                        messageId,
                        contactId
                    }
                }
            })
        } catch (error) {
            console.error('Failed to delete message:', error)
            throw error
        }
    }

    getMessage = async (messageId: string, contactId: string) => {
        try {
            return await this.prisma.whatsAppMessage.findUnique({
                where: {
                    messageId_contactId: {
                        messageId,
                        contactId
                    }
                }
            })
        } catch (error) {
            console.error('Failed to get message:', error)
            throw error
        }
    }

    getAllMessageContact = async (contactId: string) => {
        try {
            return await this.prisma.whatsAppMessage.findMany({
                where: {
                    contactId
                }
            })
        } catch (error) {
            console.error('Failed to get all messages:', error)
            throw error
        }
    }
}

