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
            console.log('QR LINK: https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=' + encodeURIComponent(qr))
        }
        if (connection === 'open') console.log('FURY CONECTADO - SOLO ADMINS')
        if (connection === 'close') setTimeout(startBot, 3000)
    })

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0]
            if (!msg.message || msg.key.fromMe) return
            let body = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || ""
            if (!body) return
            const lower = body.toLowerCase().trim()
            if (!lower.startsWith('.')) return
            const jid = msg.key.remoteJid
            const isGroup = jid.endsWith('@g.us')

            if (isGroup) {
                let metadata = await sock.groupMetadata(jid)
                let sender = msg.key.participant
                let isAdmin = metadata.participants.find(p => p.id === sender)?.admin
                if (!isAdmin) return
            }

            const args = body.slice(1).trim().split(/ +/)
            const cmd = args.shift().toLowerCase()
            const q = args.join(' ')

            if (cmd === 'menu') {
                await sock.sendMessage(jid, { text: "MENU FURY - SOLO ADMINS\n\nInfo: .ping .owner .uptime\nStickers: .sticker\nGrupos: .todos .link .grupo abrir / cerrar .admins .kick .promote\nDownload: .tiktok .play .ytmp3\nTodos listos solo para admins" })
            }
            if (cmd === 'ping') await sock.sendMessage(jid, { text: 'Pong! Fury Solo Admins Activo' })
            if (cmd === 'owner') await sock.sendMessage(jid, { text: 'Owner: Alexander Fury' })
            if (cmd === 'uptime') await sock.sendMessage(jid, { text: 'Activo: ' + Math.floor(process.uptime()/60) + ' min' })

            if (cmd === 'sticker' || cmd === 's') {
                try {
                    let buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: P({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage })
                    await sock.sendMessage(jid, { sticker: buffer })
                } catch {
                    await sock.sendMessage(jid, { text: 'Responde a una imagen con .sticker' })
                }
            }

            if (cmd === 'todos' || cmd === 'tagall') {
                if (!isGroup) return
                let metadata = await sock.groupMetadata(jid)
                let txt = "Llamando a todos: " + (q || 'Atencion') + "\n\n"
                let mentions = []
                for (let p of metadata.participants) {
                    txt += "@" + p.id.split('@')[0] + " "
                    mentions.push(p.id)
                }
                await sock.sendMessage(jid, { text: txt, mentions })
            }

            if (cmd === 'link' && isGroup) {
                let code = await sock.groupInviteCode(jid)
                await sock.sendMessage(jid, { text: "https://chat.whatsapp.com/" + code })
            }

            if (cmd === 'admins' && isGroup) {
                let metadata = await sock.groupMetadata(jid)
                let admins = metadata.participants.filter(v => v.admin)
                let txt = "Admins:\n"
                let mentions = []
                for (let a of admins) {
                    txt += "@" + a.id.split('@')[0] + "\n"
                    mentions.push(a.id)
                }
                await sock.sendMessage(jid, { text: txt, mentions })
            }

            if (cmd === 'grupo' && isGroup) {
                if (lower.includes('cerrar')) {
                    await sock.groupSettingUpdate(jid, 'announcement')
                    await sock.sendMessage(jid, { text: 'Grupo cerrado solo admins' })
                }
                if (lower.includes('abrir')) {
                    await sock.groupSettingUpdate(jid, 'not_announcement')
                    await sock.sendMessage(jid, { text: 'Grupo abierto' })
                }
            }

            if (cmd === 'kick' && isGroup) {
                let who = m.messages[0].message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                if (who) {
                    await sock.groupParticipantsUpdate(jid, [who], 'remove')
                    await sock.sendMessage(jid, { text: 'Eliminado' })
                }
            }

            if (cmd === 'promote' && isGroup) {
                let who = m.messages[0].message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                if (who) {
                    await sock.groupParticipantsUpdate(jid, [who], 'promote')
                    await sock.sendMessage(jid, { text: 'Ascendido' })
                }
            }

        } catch (e) {
            console.log('Error:', e)
        }
    })
}
startBot()
const express = require('express')
const app = express()
app.get('/', (r,s) => s.send('Fury Live Solo Admins'))
app.listen(process.env.PORT || 3000, () => console.log('Web en 3000'))
