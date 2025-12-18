import app from './app.js'
import logger from './config/logger.js'
import { createServer } from 'http'
import { SocketService } from './config/socket.js'

const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 3001
const dbUrl = process.env.DATABASE_URL
const frontendUrl = process.env.FRONTEND_URL

const startServer = async () => {
    try {
        logger.info({ dbUrl, frontendUrl }, 'Starting server')

        const server = createServer(app)

        SocketService.getInstance(server)

        server.listen(port, () => {
            logger.info({ host, port }, `Server running at http://${host}:${port}`)
        })
    } catch (error) {
        logger.error({ error }, 'Error starting server')
        process.exit(1)
    }
}

startServer()