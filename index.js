const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'open') console.log('✅ CONECTADO AL 100%')
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) startBot()
        }
    })

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0]
            if (!msg.message) return
            
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
            console.log('Mensaje recibido:', text, 'de:', msg.key.remoteJid)

            if (text.toLowerCase() === '.menu') {
                await sock.sendMessage(msg.key.remoteJid, { text: '✅ BOT ACTIVO\n\nComandos:\n.menu\n.ping' })
            }
            if (text.toLowerCase() === '.ping') {
                await sock.sendMessage(msg.key.remoteJid, { text: 'Pong! ✅ Bot Online' })
            }
        } catch (e) {
            console.log('Error:', e)
        }
    })
}
startBot()

const express = require('express')
const app = express()
app.get('/', (req, res) => res.send('Bot Online ✅'))
app.listen(process.env.PORT || 3000)
