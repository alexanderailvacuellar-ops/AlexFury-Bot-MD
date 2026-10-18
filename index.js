import makeWASocket, { useMultiFileAuthState, DisconnectReason, downloadMediaMessage } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import express from 'express'
import fs from 'fs'

const app = express()
const PORT = process.env.PORT || 10000
const OWNER = ['573227642844', '573227624844'] // tu número

app.get('/', (req,res) => res.send('<h1>AlexFury Bot Activo ✅</h1><p>Sesión activa - 1 de 4</p>'))
app.listen(PORT, () => console.log('Puerto ' + PORT))

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['AlexFury Bot', 'Chrome', '1.0'],
    markOnlineOnConnect: true
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom ? lastDisconnect.error.output.statusCode : 0) !== DisconnectReason.loggedOut
      console.log('Conexión cerrada, reconectando...', shouldReconnect)
      if (shouldReconnect) startBot()
    } else if (connection === 'open') {
      console.log('✅ ALEXFURY BOT CONECTADO AL 100%')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if (!m.message || m.key.fromMe) return
    const from = m.key.remoteJid
    const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ''
    const prefix = '.'
    if (!body.startsWith(prefix)) return
    const args = body.slice(prefix.length).trim().split(/ +/)
    const command = args.shift().toLowerCase()

    const reply = (text) => sock.sendMessage(from, { text }, { quoted: m })

    if (command === 'menu' || command === 'help') {
      return reply(
`╭━〔 *ALEXFURY BOT* 〕━╮
┃ ✅ Sesión activa
┃ 
┃ *COMANDOS*
┃ • .menu - Este menú
┃ • .ping - Velocidad
┃ • .owner - Dueño
┃ • .sticker / .s - Imagen a sticker
┃ • .toimg - Sticker a imagen
┃ • .say [texto] - El bot repite
╰━━━━━━━━━━━━━━━╯`
      )
    }
    if (command === 'ping') {
      const start = Date.now()
      await reply('Pong...')
      return reply(`*Pong!* ${Date.now() - start}ms`)
    }
    if (command === 'owner') {
      return reply('Mi dueño es AlexFury wa.me/573227642844')
    }
    if (command === 'say') {
      if (!args.length) return reply('Escribe .say hola')
      return reply(args.join(' '))
    }
    if (command === 'sticker' || command === 's') {
      const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage
      const msg = quoted ? { message: quoted } : m
      const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage })
      if (!buffer) return reply('Responde a una imagen con .s')
      return sock.sendMessage(from, { sticker: buffer }, { quoted: m })
    }
    if (command === 'toimg') {
      const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage
      if (!quoted) return reply('Responde a un sticker con .toimg')
      const buffer = await downloadMediaMessage({ message: { stickerMessage: quoted } }, 'buffer', {}, { logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage })
      return sock.sendMessage(from, { image: buffer }, { quoted: m })
    }
  })
}

startBot()
