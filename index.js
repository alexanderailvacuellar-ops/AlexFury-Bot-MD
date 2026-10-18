const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const P = require('pino')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    const sock = makeWASocket({ 
        logger: P({ level: 'silent' }), 
        auth: state,
        browser: ["Chrome","Ubuntu","110.0.0.0"]
    })
    sock.ev.on('creds.update', saveCreds)
    
    sock.ev.on('connection.update', async (u) => {
        if (u.connection === 'open') console.log('✅ FURY FULL CONECTADO')
        if (u.connection === 'close') setTimeout(startBot, 3000)
    })

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0]
            if (!msg.message || msg.key.fromMe) return
            const body = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
            const text = body.trim().toLowerCase()
            const jid = msg.key.remoteJid
            if (!text.startsWith('.')) return

            if (text === '.menu') {
                const menu = `🌐 *Menu Principal Fury*
👤 Usuario: ${msg.pushName || 'User'}
🔰 Bot: Fury Activo ✅

📊 *Info* 
╰➤ .owner .creador .ds .ping .uptime .sistema .horario

⚙ *On/Off*
╰➤ .enable .disable .on .off

⬇ *Download*
╰➤ .apk .audio .capcut .ig .mediafire .mega .pindl .spotify .tiktok .yta .ytmp3 .ytmp4 .deezer

🔍 *Search*
╰➤ .appstore .githubsearch .pinterest .spotifysearch .yts .tiktoksearch .xnxxsearch

💭 *Inteligencias*
╰➤ .aimath .flux .ai .luminai

🥧 *Free Fire*
╰➤ .inmixto4 .inmixto6 .inmasc4 .inmasc6 .infem4 .infem6 .donarsala .v4mixto .v6mixto

🍯 *Frases*
╰➤ .consejo .fraseromantica .piropo

🪾 *Convertidores*
╰➤ .toptt .toimg .tovideo

🧰 *Tools*
╰➤ .removebg .hd .remini .igstalk .ssweb .tourl .traductor

👥 *Grupos*
╰➤ .add .admins .delete .demote .kick .link .mute .promote .setwelcome .todos .grupo abrir/cerrar

🎨 *Stickers*
╰➤ .brat .dado .qc .sticker .wm

💰 *RPG*
╰➤ .ruleta .bank .pelear .daily .work .minar .robar

📇 *Registro*
╰➤ .perfil .reg .unreg .setbirth

⚒ *Owner*
╰➤ .addowner .banchat .block .restart .join .update`;
                await sock.sendMessage(jid, { text: menu })
            }
            if (text === '.ping') {
                await sock.sendMessage(jid, { text: '🏓 Pong! Fury Activo ✅' })
            }
            if (text === '.owner') {
                await sock.sendMessage(jid, { text: '👑 Owner: Alexander Fury' })
            }
        } catch(e) { console.log(e) }
    })
}
startBot()
const express = require('express')
const app = express()
app.get('/', (req,res) => res.send('Fury Full Live'))
app.listen(process.env.PORT || 3000, () => console.log('Web en 3000'))
