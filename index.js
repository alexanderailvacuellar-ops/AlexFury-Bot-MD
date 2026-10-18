const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const P = require('pino')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    const sock = makeWASocket({ logger: P({ level: 'silent' }), auth: state, browser: ["Chrome","Ubuntu","110.0.0.0"] })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', async (u) => {
        if (u.connection === 'open') console.log('✅ FURY FULL CONECTADO')
        if (u.connection === 'close') setTimeout(startBot, 3000)
    })

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim()
        const text = body.toLowerCase()
        const jid = msg.key.remoteJid

        if (text === '.menu') {
            const menu = `🌐 *Menú Principal*
────────────────────────────
👤 Usuario: ${msg.pushName}
🔰 Rol: Novato V ⚔️
📈 Bot: Fury Bot ✅

📊 *Info* 
╰➤ .owner
╰➤ .creador
╰➤ .ds
╰➤ .fixmsgespera
╰➤ .ping
╰➤ .botetiquetas
╰➤ .report
╰➤ .uptime
╰➤ .sistema
╰➤ .sugerencia
╰➤ .totalf
╰➤ .horario

⚙ *On/Off*
╰➤ .enable opción
╰➤ .disable opción
╰➤ .on opción
╰➤ .off opción

⬇ *Download*
╰➤ .apk
╰➤ .appdownload
╰➤ .ipadownload
╰➤ .aptoide
╰➤ .audio
╰➤ .capcut
╰➤ .ig
╰➤ .igv2
╰➤ .mediafire
╰➤ .mega
╰➤ .pindl
╰➤ .pinvid
╰➤ .playstore
╰➤ .spotify
╰➤ .tiktok
╰➤ .tiktokrandom
╰➤ .tiktokv2
╰➤ .yta
╰➤ .ytmp3
╰➤ .ytmp3v2
╰➤ .ytmp4
╰➤ .ytmp4v2
╰➤ .ytv
╰
