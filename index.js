import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import express from 'express'
import fs from 'fs'

const app = express()
let qrCode = null

app.get('/', (req,res) => {
  if (qrCode) {
    res.send(`<h1>Escanea este QR</h1><img src="${qrCode}" style="width:300px"><p>O usa el código de los Logs</p>`)
  } else {
    res.send('<h1>AlexFury Bot ✅</h1><p>Ya vinculado o esperando código en Logs</p>')
  }
})
app.listen(process.env.PORT || 10000, () => console.log('Web lista'))

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['AlexFury Bot', 'Chrome', '1.0'],
    printQRInTerminal: true
  })
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect, qr } = u
    if (qr) {
      const QRCode = await import('qrcode')
      qrCode = await QRCode.toDataURL(qr)
      console.log('QR generado, abre tu link de Render para escanearlo: https://alexfury-bot-md.onrender.com')
    }
    if (connection === 'open') {
      console.log('✅ CONECTADO AL 100%')
      qrCode = null
    }
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot()
    }
  })

  if (!state.creds.registered) {
    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode('573227624844')
        console.log(`\nTU CODIGO ES: ${code.match(/.{1,4}/g).join('-')}\n`)
      } catch(e){ console.log('Esperando QR...') }
    }, 4000)
  }

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if (!m.message) return
    const body = m.message.conversation || m.message.extendedTextMessage?.text || ''
    if (!body.startsWith('.')) return
    const cmd = body.slice(1).split(' ')[0].toLowerCase()
    const from = m.key.remoteJid
    if (cmd === 'menu') sock.sendMessage(from, { text: '✅ BOT ACTIVO\n.menu\n.ping' }, { quoted: m })
    if (cmd === 'ping') sock.sendMessage(from, { text: 'Pong!' }, { quoted: m })
  })
}
startBot()
