import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { WhatsAppService } from './service.js'

export class WhatsAppController {
    private whatsappService: WhatsAppService
    constructor() {
        this.whatsappService = WhatsAppService.getInstance()
    }

    renderSessionPage = (req: Request, res: Response) => {
        res.render('whatsapp')
    }

    createSession = (req: Request, res: Response) => {
        const whatsappId = uuidv4()
        const sessionName = req.body.sessionName
        this.whatsappService.createConnection(whatsappId, sessionName)
        res.json({ whatsappId })
    }

    updateSession = (req: Request, res: Response) => {
        const whatsappId = req.params.id
        const status = req.body.status
        res.json({ whatsappId, status })
    }

    deleteSession = (req: Request, res: Response) => {
        const whatsappId = req.params.id
        this.whatsappService.closeConnection(whatsappId)
        res.json({ whatsappId })
    }

    login = (req: Request, res: Response) => {
        const whatsappId = req.body.whatsappId
        res.json({ whatsappId })
    }

    logout = (req: Request, res: Response) => {
        const whatsappId = req.body.whatsappId
        res.json({ whatsappId })
    }

    cancel = (req: Request, res: Response) => {
        const whatsappId = req.body.whatsappId
        res.json({ whatsappId })
    }

    reconnect = (req: Request, res: Response) => {
        const whatsappId = req.body.whatsappId
        res.json({ whatsappId })
    }
}