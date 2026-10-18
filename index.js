const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const P = require('pino')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.00"]
    })

    if (!sock.authState.creds.registered) {
        const number = "573227624844" // TU NÚMERO DEL BOT
        setTimeout(async () => {
            let code = await sock.requestPairingCode(number)
            console.log("TU CODIGO: " + code)
        }, 3000)
    }

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (u) => {
        if (u.connection === 'open') console.log('✅ CONECTADO AL 100%')
        if (u.connection === 'close') startBot()
    })

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return
        const from = msg.key.remoteJid
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
        const cmd = text.toLowerCase().split(' ')[0]

        if (cmd === '.menu' || cmd === '.help') {
            let menu = `🌐 *Menú Principal*
────────────────────────────
👤 Usuario: ALEXANDER 🤠
🔰 Rol: Novato V ⚔️
📈 Nivel: 0 (27641 XP)
💎 Gemas: 15
⏱ Activo: 117:35:16

📊 *Info* 
╰➤ .owner
╰➤ .creador
╰➤ .ping
╰➤ .bot

⚙ *On/Off*
╰➤ .enable opción
╰➤ .disable opción

⬇ *Download*
╰➤ .play
╰➤ .tiktok
╰➤ .ig
╰➤ .fb
╰➤ .ytmp3
╰➤ .ytmp4
╰➤ .mediafire
╰➤ .spotify

🔍 *Search*
╰➤ .pinterest
╰➤ .yts
╰➤ .google

💭 *Inteligencias*
╰➤ .ai
╰➤ .flux

🎨 *Stickers*
╰➤ .s / .sticker
╰➤ .qc <texto>
╰➤ .brat <texto>

👥 *Grupos*
╰➤ .add <numero>
╰➤ .kick @usuario
╰➤ .promote
╰➤ .demote
╰➤ .todos
╰➤ .grupo abrir/cerrar
╰➤ .link

💰 *RPG*
╰➤ .daily
╰➤ .work
╰➤ .minar
╰➤ .bank

_Hecho por AlexFury Bot_ - ✅ ACTIVO`

            await sock.sendMessage(from, { text: menu })
        }

        if (cmd === '.ping') {
            await sock.sendMessage(from, { text: 'Pong! ✅ 100ms\nBOT FURY ACTIVO' })
        }
        if (cmd === '.owner') {
            await sock.sendMessage(from, { text: '👑 Creador: wa.me/573124354918' })
        }
    })
}
startBot()

const express = require('express')
const app = express()
app.get('/', (req,res)=>res.send('Bot Live'))
app.listen(process.env.PORT || 3000)
