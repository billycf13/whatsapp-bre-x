import { WAMessage } from '@whiskeysockets/baileys'
import { ChatwootService } from './service.js'

// Mock credentials based on user input
const BASE_URL = 'http://127.0.0.1:3001'
const TOKEN = 'vLv6qxyBuyVJfModT6vBgQnY'
const ACCOUNT_ID = 1

const chatwoot = new ChatwootService(BASE_URL, TOKEN, ACCOUNT_ID)

async function runTests() {
    console.log('🚀 Starting Chatwoot Service Tests...\n')

    try {
        // 1. Get All Inboxes
        console.log('--- Testing getAllListInbox ---')
        const inboxes = await chatwoot.getAllListInbox()
        console.log('Success:', inboxes.success)
        if (inboxes.success) {
            console.log('Data count:', inboxes.data?.length)
            // console.log('Sample Data:', inboxes.data?.[0])
        } else {
            console.error('Error:', inboxes.error?.response?.data || inboxes.error)
        }
        console.log('\n')

        // 2. Create Inbox
        console.log('--- Testing createInbox ---')
        const newInbox = await chatwoot.createInbox('Test Inbox TS', 'http://example.com/webhook')
        console.log('Success:', newInbox.success)
        let createdInboxId: number | undefined
        if (newInbox.success) {
            console.log('Created Inbox ID:', newInbox.data?.id)
            createdInboxId = newInbox.data?.id
        } else {
            console.error('Error:', newInbox.error?.response?.data || newInbox.error)
        }
        console.log('\n')

        // 3. Update Webhook URL
        if (createdInboxId) {
            console.log('--- Testing updateWebhookUrl ---')
            const updateInbox = await chatwoot.updateWebhookUrl(createdInboxId, 'http://example.com/updated-webhook')
            console.log('Success:', updateInbox.success)
            console.log('Updated Webhook:', updateInbox.data)
            console.log('\n')
        }

        // 4. Check/Search Contact
        console.log('--- Testing checkContactExists ---')
        const identifier = '6285179573501@s.whatsapp.net'
        const phone = '6285179573501'
        const contactCheck = await chatwoot.checkContactExists(identifier, phone)
        console.log('Success:', contactCheck.success)
        console.log('Exists:', contactCheck.exists)
        console.log('Data:', contactCheck.data)
        console.log('\n')

        // 5. Create Contact (If not exists or for testing)
        console.log('--- Testing createContact ---')
        const newContact = await chatwoot.createContact(
            Number(createdInboxId) || 1,
            'John Doe Test',
            `test-${Date.now()}@s.whatsapp.net`,
            `+62899${Math.floor(Math.random() * 1000000)}`
        )
        console.log('Success:', newContact.success)
        let createdContactId = 0
        if (newContact.success) {
            console.log('Created Contact ID:', newContact.data?.id)
            createdContactId = newContact.data?.id
        } else {
            console.error('Error:', newContact.error?.response?.data || newContact.error)
        }
        console.log('\n')

        // 6. Update Contact Name
        if (createdContactId) {
            console.log('--- Testing updateContactName ---')
            const updateContact = await chatwoot.updateContactName(createdContactId.toString(), 'John Doe Updated')
            console.log('Success:', updateContact.success)
            console.log('\n')
        }

        // 7. Check Conversation
        if (createdContactId) {
            console.log('--- Testing checkConversationExists ---')
            const convCheck = await chatwoot.checkConversationExists(1, 10)
            console.log('Success:', convCheck.success)
            console.log('Exists:', convCheck.exists)
            console.log('Data:', convCheck.data)
            console.log('\n')
        }

        // 8. Create Conversation
        if (createdContactId) {
            console.log('--- Testing createConversation ---')
            const newConv = await chatwoot.createConversation(
                1,
                `source-${Date.now()}`,
                10
            )
            console.log('Success:', newConv.success)
            let createdConvId = 0
            if (newConv.success) {
                console.log('Created Conversation ID:', newConv.data?.id)
                createdConvId = newConv.data?.id
            } else {
                console.error('Error:', newConv.error?.response?.data || newConv.error)
            }
            console.log('\n')

            // 9. Create Message (Text)
            if (createdConvId) {
                console.log('--- Testing createMessage (Text) ---')
                const newMessage = await chatwoot.createMessage(
                    16,
                    'Hello from TypeScript Test Script!',
                    'text',
                    'incoming',
                    `msg-${Date.now()}`,
                )
                console.log('Success:', newMessage.success)
                console.log('Message ID:', newMessage.data?.id)
                console.log('\n')
            }
        }

    } catch (err) {
        console.error('❌ Test crashed:', err)
    }

    console.log('🏁 Tests completed.')
}

runTests()
