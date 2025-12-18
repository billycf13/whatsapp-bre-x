import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient | null = null

function createPrismaClient() {
    return new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
        errorFormat: 'pretty',
    })
}

export async function connectDatabase() {
    try {
        if (!prisma) {
            prisma = createPrismaClient()
        }

        await prisma.$connect()
    } catch (error) {
        console.error('Failed to connect to the database:', error)
        throw error
    }
}

export async function disconnectDatabase() {
    try {
        if (prisma) {
            await prisma.$disconnect()
            prisma = null
        }
    } catch (error) {
        console.error('Failed to disconnect from the database:', error)
        throw error
    }
}

export function getPrismaClient(): PrismaClient {
    if (!prisma) {
        throw new Error('Database connection not initialized')
    }

    return prisma
}
