const { default: makeWASocket, useMultiFileAuthState, downloadMediaMessage } = require('@whiskeysockets/baileys')
const P = require('pino')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const sock = makeWASocket({ 
        logger: P({ level: 'silent' }), 
        auth: state,
        browser: ["Fury Bot","Chrome","1.0"]
    })
    sock.ev.on('creds.update', saveCreds)
    
    sock.ev.on('connection.update', async (u) => {
        const { qr, connection } = u
        if (qr) {
            console.log('=== NUEVO QR GENERADO ===')
            console.log(`QR LINK: https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qr)}`)
        }
        if (connection === 'open') console.log('✅ FURY FULL CONECTADO')
        if (connection === 'close') setTimeout(startBot, 4000)
    })

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0]
            if (!msg.message || msg.key.fromMe) return
            const body = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || ""
            const text = body.trim()
            const lower = text.toLowerCase()
            const jid = msg.key.remoteJid
            const isGroup = jid.endsWith('@g.us')

            if (!lower.startsWith('.')) return

            const args = text.slice(1).trim().split(/ +/)
            const command = args.shift().toLowerCase()

            // MENU
            if (command === 'menu') {
                const menu = `🌐 *Menu Principal Fury*
👤 Usuario: ${msg.pushName || 'User'}
🔰 Bot: Fury Activo ✅

📊 *Info* 
╰➤ .owner .ping .uptime .sistema

⚙ *On/Off*
╰➤ .enable .disable

⬇ *Download*
╰➤ .tiktok .ig .ytmp3 .ytmp4 .play

🔍 *Search*
╰➤ .yts .pinterest .tiktoksearch

💭 *IAs*
╰➤ .ai

🥧 *Free Fire*
╰➤ .v4
