import { Router } from 'express'
import { WhatsAppController } from './controller.js'

export class whatsappRoutes {
    public router: Router
    private whatsappController: WhatsAppController

    constructor() {
        this.router = Router()
        this.whatsappController = new WhatsAppController()
        this.setupRoutes()
    }

    private setupRoutes() {
        this.router.get('/', this.whatsappController.renderSessionPage)
        this.router.post('/', this.whatsappController.createSession)
        this.router.put('/:id/edit', this.whatsappController.updateSession)
        this.router.delete('/:id', this.whatsappController.deleteSession)

        this.router.post('/login', this.whatsappController.login)
        this.router.post('/logout', this.whatsappController.logout)
        this.router.post('/cancel', this.whatsappController.cancel)
        this.router.post('/reconnect', this.whatsappController.reconnect)
    }
}