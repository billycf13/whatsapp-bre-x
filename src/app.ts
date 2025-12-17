import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

function createApp(): Application {
    const app: Application = express()

    app.use(cors(
        {
            origin: process.env.FRONTEND_URL,
            credentials: true
        }
    ))
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(express.static(path.join(process.cwd(), 'public')))

    app.get('/', (req: Request, res: Response) => {
        res.send('Hello World!')
    })

    return app
}

const app = createApp()
export default app