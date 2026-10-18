const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')
if (fs.existsSync('./auth')) fs.rmSync('./auth', { recursive: true, force: true })
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    const sock = makeWASocket({ logger: P({ level: 'silent' }), auth: state, browser: ["Chrome","Ubuntu","110.0.0.0"] })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', async (u) => {
        if (u.qr) {
            console.log("QR LINK: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(u.qr))
            console.log("ABRE ESE LINK EN OTRO CELULAR PARA VER EL QR")
        }
        if (u.connection === 'open') console.log('CONECTADO AL 100%')
        if (u.connection === 'close') setTimeout(startBot, 3000)
    })
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.message) return
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
        if (text.toLowerCase() === '.menu') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'BOT FURY ACTIVO ✅\n.menu\n.ping' })
        }
    })
}
startBot()
require('express')().get('/',(a,b)=>b.send('Bot Live')).listen(process.env.PORT||3000)
