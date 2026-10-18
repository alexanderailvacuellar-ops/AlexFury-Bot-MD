const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')

// ESTO BORRA LA SESION DAÑADA AUTOMATICAMENTE
if (fs.existsSync('./auth')) {
   try { fs.rmSync('./auth', { recursive: true, force: true }); console.log("Auth vieja borrada") } catch {}
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.00"]
    })

    if (!sock.authState.creds.registered) {
        const number = "573227624844" // <--- CAMBIA ESTO POR TU NUMERO REAL DEL BOT
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(number)
                console.log("==================================")
                console.log(" TU CODIGO ES: " + code)
                console.log("==================================")
            } catch {}
        }, 5000)
    }

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (u) => {
        if (u.connection === 'open') console.log('✅ CONECTADO AL 100%')
        if (u.connection === 'close') setTimeout(() => startBot(), 3000)
    })

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return
        const from = msg.key.remoteJid
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
        const cmd = text.trim().split(' ')[0].toLowerCase()

        if (cmd === '.menu' || cmd === '.help') {
            let menu = `🌐 *Menú Principal*\n👤 Usuario: ALEXANDER\n\n📊 Info\n├ .owner\n├ .ping\n├ .bot\n\n⬇ Download\n├ .play\n├ .tiktok\n├ .fb\n├ .ytmp3\n├ .ytmp4\n\n🎨 Stickers\n├ .s / .sticker\n\n_Hecho por AlexFury Bot - ACTIVO_`
            await sock.sendMessage(from, { text: menu })
        }
        if (cmd === '.ping') await sock.sendMessage(from, { text: 'Pong! ✅ BOT FURY ACTIVO' })
        if (cmd === '.owner') await sock.sendMessage(from, { text: 'Creador: wa.me/573124354518' })
    })
}
startBot()

const express = require('express')
const app = express()
app.get('/', (req,res)=>res.send('Bot Live'))
app.listen(process.env.PORT || 3000)
