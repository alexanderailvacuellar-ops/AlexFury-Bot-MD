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
            console.log('=== NUEVO QR ===')
            console.log(`QR LINK: https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qr)}`)
        }
        if (connection === 'open') console.log('✅ FURY FULL CONECTADO - SOLO ADMINS')
        if (connection === 'close') setTimeout(startBot, 3000)
    })

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0]
            if (!msg.message || msg.key.fromMe) return
            let body = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || ""
            if (!body) return
            const lower = body.toLowerCase().trim()
            if (!lower.startsWith('.')) return

            const jid = msg.key.remoteJid
            const isGroup = jid.endsWith('@g.us')

            // FILTRO SOLO ADMINS EN GRUPOS
            if (isGroup) {
                let metadata = await sock.groupMetadata(jid)
                let sender = msg.key.participant
                let participant = metadata.participants.find(p => p.id === sender)
                if (!participant?.admin) return // ignora si no es admin
            }

            const args = body.slice(1).trim().split(/ +/)
            const cmd = args.shift().toLowerCase()
            const q = args.join(' ')

            if (cmd === 'menu') {
                let menu = `🌐 *Menu Principal Fury - SOLO ADMINS* 🔒
👤 ${msg.pushName}

📊 *Info*
╰➤ .owner .ping .uptime .sistema .horario

⚙ *On/Off*
╰➤ .enable .disable

⬇ *Download*
╰➤ .tiktok .ig .ytmp3 .ytmp4 .play

🔍 *Search*
╰➤ .yts .pinterest .tiktoksearch

💭 *IAs*
╰➤ .ai

🥧 *Free Fire*
╰➤ .v4mixto .v6mixto .donarsala

🪾 *Convertidores*
╰➤ .toimg

🧰 *Tools*
╰➤ .removebg .hd .ssweb .tourl

👥 *Grupos*
╰➤ .add .kick .promote .demote .link .todos .grupo abrir/cerrar .admins .tagall

🎨 *Stickers*
╰➤ .sticker .wm

💰 *RPG*
╰➤ .daily .work .minar

⚒ *Owner*
╰➤ .restart`
                await sock.sendMessage(jid, { text: menu })
            }

            // INFO
            if (cmd === 'ping') await sock.sendMessage(jid, { text: '🏓 Pong! Fury Solo Admins ✅' })
            if (cmd === 'owner') await sock.sendMessage(jid, { text: '👑 Alexander Fury' })
            if (cmd === 'uptime') await sock.sendMessage(jid, { text: `⏱ ${Math.floor(process.uptime()/60)} min` })
            if (cmd === 'sistema' || cmd === 'horario') await sock.sendMessage(jid, { text: `💻 Fury Bot Activo | ${new Date().toLocaleString('es-CO')}` })

            // STICKER
            if (cmd === 'sticker' || cmd === 's') {
                try {
                    let buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: P({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage })
                    await sock.sendMessage(jid, { sticker: buffer })
                } catch { await sock.sendMessage(jid, { text: '❌ Responde a una imagen con .sticker' }) }
            }
            if (cmd === 'wm') await sock.sendMessage(jid, { text: 'Usa .sticker para crear' })
            if (cmd === 'toimg') await sock.sendMessage(jid, { text: 'Responde a un sticker con .toimg' })

            // GRUPOS - TODOS FUNCIONANDO
            if (cmd === 'todos' || cmd === 'tagall') {
                if (!isGroup) return
                let metadata = await sock.groupMetadata(jid)
                let txt = `📢 *${q || 'Atención'}*\n\n`
                let mentions = []
                for (let p of metadata.participants) { txt += `@${p.id.split('@')[0]} `; mentions.push(p.id) }
                await sock.sendMessage(jid, { text: txt, mentions })
            }
            if (cmd === 'link' && isGroup) {
                let code = await sock.groupInviteCode(jid)
                await sock.sendMessage(jid, { text: `🔗 https://chat.whatsapp.com/${code}` })
            }
            if (cmd === 'admins' && isGroup) {
                let metadata = await sock.groupMetadata(jid)
                let admins = metadata.participants.filter(v => v.admin)
                let txt = `👑 *Admins:*\n`; let mentions = []
                for (let a of admins) { txt += `@${a.id.split('@')[0]}\n`; mentions.push(a.id) }
                await sock.sendMessage(jid, { text: txt, mentions })
            }
            if (cmd === 'grupo' && isGroup) {
                if (q.includes('cerrar')) { await sock.groupSettingUpdate(jid, 'announcement'); await sock.sendMessage(jid, { text: 'Grupo
