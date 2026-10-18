
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
        if (connection === 'open') console.log('✅ FURY CONECTADO')
        if (connection === 'close') setTimeout(startBot, 4000)
    })
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0]
            if (!msg.message || msg.key.fromMe) return
            const body = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || ""
            const lower = body.toLowerCase().trim()
            const jid = msg.key.remoteJid
            const isGroup = jid.endsWith('@g.us')
            if (!lower.startsWith('.')) return
            const args = lower.slice(1).split(' ')
            const cmd = args[0]

            if (cmd === 'menu') {
                let txt = `🌐 *Menu Fury Full* ✅\n\n📊 .owner .ping .uptime .sistema\n🎨 .sticker .wm\n👥 .todos .link .grupo abrir/cerrar .add .kick .promote .demote .admins\n⬇ .tiktok .play\n🔍 .yts\n🧰 .hd .tourl`
                await sock.sendMessage(jid, { text: txt })
            }
            if (cmd === 'ping') await sock.sendMessage(jid, { text: '🏓 Pong Fury ✅' })
            if (cmd === 'owner') await sock.sendMessage(jid, { text: '👑 Alexander Fury' })
            if (cmd === 'uptime') await sock.sendMessage(jid, { text: `⏱ ${Math.floor(process.uptime()/60)} min activo` })

            if (cmd === 'sticker' || cmd === 's') {
                const q = msg.message.imageMessage || msg.message.videoMessage || msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
                if (!q) return sock.sendMessage(jid, { text: 'Responde a una foto con .sticker' })
                let buf = await downloadMediaMessage(msg, 'buffer', {}, { logger: P({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage })
                await sock.sendMessage(jid, { sticker: buf })
            }

            if (cmd === 'todos') {
                if (!isGroup) return
                let meta = await sock.groupMetadata(jid)
                let txt = `📢 Todos:\n`
                let mentions = []
                for (let p of meta.participants) { txt += `@${p.id.split('@')[0]} `; mentions.push(p.id) }
                await sock.sendMessage(jid, { text: txt, mentions })
            }

            if (cmd === 'link' && isGroup) {
                let code = await sock.groupInviteCode(jid)
                await sock.sendMessage(jid, { text: `https://chat.whatsapp.com/${code}` })
            }

            if (cmd === 'grupo' && isGroup) {
                let action = args[1]
                if (action === 'cerrar') await sock.groupSettingUpdate(jid, 'announcement')
                if (action === 'abrir') await sock.groupSettingUpdate(jid, 'not_announcement')
                await sock.sendMessage(jid, { text: `Grupo ${action} ✅` })
            }

        } catch (e) { console.log(e) }
    })
}
startBot()
const express = require('express')
const app = express()
app.get('/', (r,s) => s.send('Fury Live'))
app.listen(process.env.PORT || 3000, () => console.log('Web en 3000'))
