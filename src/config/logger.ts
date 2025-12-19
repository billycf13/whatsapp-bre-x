import pino, { Logger, LoggerOptions, DestinationStream } from 'pino'

// Log levels for configuration
export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent'

// Environment configuration
const isDevelopment = process.env.NODE_ENV !== 'production'
const logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (isDevelopment ? 'debug' : 'info')

// Base logger options
const baseOptions: LoggerOptions = {
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
        level: (label) => ({ level: label }),
        bindings: (bindings) => ({
            pid: bindings.pid,
            host: bindings.hostname,
        }),
    },
    base: {
        app: 'whatsapp-bre-x',
    },
}

// Pretty print transport for development
const prettyTransport: DestinationStream | undefined = isDevelopment
    ? pino.transport({
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            messageFormat: '{msg}',
        },
    })
    : undefined

// Main application logger
const logger: Logger = prettyTransport
    ? pino(baseOptions, prettyTransport)
    : pino(baseOptions)

/**
 * Create a child logger for a specific module
 * @param moduleName - Name of the module (e.g., 'http', 'database', 'cache')
 */
export function createModuleLogger(moduleName: string): Logger {
    return logger.child({ module: moduleName })
}

/**
 * Create a child logger for WhatsApp session management
 * @param sessionId - Unique session identifier
 */
export function createSessionLogger(sessionName: string): Logger {
    return logger.child({
        module: 'whatsapp',
        sessionName,
    })
}

export function createChatwootLogger(inbox_name: string): Logger {
    return logger.child({
        module: 'chatwoot',
        inbox_name,
    })
}


/**
 * Baileys logger interface - compatible with Baileys library
 * Returns a pino logger that can be used directly with Baileys
 */
export interface BaileysLoggerOptions {
    sessionName: string
    level?: LogLevel
}

/**
 * Create a Baileys-compatible logger
 * This logger is designed to work with @whiskeysockets/baileys library
 * @param options - Logger options including sessionId and optional log level
 */
export function createBaileysLogger(options: BaileysLoggerOptions): Logger {
    const { sessionName, level = 'warn' } = options

    const baileysOptions: LoggerOptions = {
        level,
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
            level: (label) => ({ level: label }),
        },
        base: {
            app: 'whatsapp-bre-x',
            module: 'baileys',
            sessionName,
        },
    }

    // For development, use pretty transport; for production, use standard output
    if (prettyTransport) {
        return pino(baileysOptions, prettyTransport)
    }

    return pino(baileysOptions)
}

/**
 * Create a silent logger (no output)
 * Useful for testing or when you want to completely disable logging
 */
export function createSilentLogger(): Logger {
    return pino({ level: 'silent' })
}

// Export the main logger as default
export default logger

// Re-export pino types for convenience
export type { Logger } from 'pino'
