const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.00"]
    })

    if (!sock.authState.creds.registered) {
        const number = "573227624844" // <--- PON AQUÍ TU NÚMERO DEL BOT SIN + EJ: 573001234567
        setTimeout(async () => {
            let code = await sock.requestPairingCode(number)
            console.log("TU CODIGO DE VINCULACION ES: " + code)
        }, 3000)
    }

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (update) => {
        const { connection } = update
        if (connection === 'open') console.log('✅ CONECTADO AL 100%')
        if (connection === 'close') {
            console.log('Desconectado, reconectando...')
            startBot()
        }
    })

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.message) return
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
        console.log('Mensaje:', text)
        if (text.toLowerCase() === '.menu') {
            await sock.sendMessage(msg.key.remoteJid, { text: '✅ BOT ACTIVO\n\n.menu\n.ping' })
        }
        if (text.toLowerCase() === '.ping') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Pong! ✅' })
        }
    })
}
startBot()

const express = require('express')
const app = express()
app.get('/', (req,res)=>res.send('Bot Live'))
app.listen(process.env.PORT || 3000)
