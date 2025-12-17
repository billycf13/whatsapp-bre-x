import app from './app.js'

const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 3000

const startServer = async () => {
    try {
        app.listen(port, () => {
            console.log(`Server running at http://${host}:${port}`)
        })
    } catch (error) {
        console.error('Error starting server:', error)
    }
}

startServer()