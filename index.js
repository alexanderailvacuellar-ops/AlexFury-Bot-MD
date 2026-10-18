import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import express from 'express'
import fs from 'fs'

const app = express()
const PORT = process.env.PORT || 10000
app.get('/', (req,res) => res.send('<h1>AlexFury Bot Sin Disk ✅</h1>'))
app.listen(PORT, () => console.log('Puerto ' + PORT))

// Cargar sesión desde variable si existe
if (process.env.SESSION_ID) {
  if (!fs.existsSync('./auth')) fs.mkdirSync('./auth', { recursive: true })
  const data = Buffer.from(process.env.SESSION_ID, 'base64').toString()
  fs.writeFileSync('./auth/creds.json', data)
  console.log('Sesión restaurada desde SESSION_ID')
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['AlexFury Bot', 'Chrome', '1.0'],
    printQRInTerminal: false
  })

  sock.ev.on('creds.update', async () => {
    await saveCreds()
    // Cuando se conecte, genera el código para guardar
    if (fs.existsSync('./auth/creds.json')) {
      const creds = fs.readFileSync('./auth/creds.json')
      const b64 = Buffer.from(creds).toString('base64')
      console.log('\n\n========== COPIA ESTO EN RENDER ==========')
      console.log(b64)
      console.log('========== FIN ==========\n\n')
      console.log('Pon esto en Environment > SESSION_ID')
    }
  })

  // CÓDIGO DE VINCULACIÓN
  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      let code = await sock.requestPairingCode('573227624844')
      code = code.match(/.{1,4}/g).join('-')
      console.log(`\nTU CODIGO ES: ${code}\n`)
    }, 3000)
  }

  sock.ev.on('connection.update', (u) => {
    if(u.connection === 'open') console.log('✅ CONECTADO AL 100% - Sin necesidad de Disk')
    if(u.connection === 'close') {
      const should = u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      if(should) startBot()
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if (!m.message) return
    const from = m.key.remoteJid
    const body = m.message.conversation || m.message.extendedTextMessage?.text || ''
    console.log('Msg:', body)
    if (!body.startsWith('.')) return
    const cmd = body.slice(1).split(' ')[0].toLowerCase()
    const reply = (t) => sock.sendMessage(from, { text: t }, { quoted: m })
    if (cmd === 'menu') reply('✅ AlexFury Bot 100% ACTIVO\n\n.menu\n.ping\n.say hola')
    if (cmd === 'ping') reply('Pong! Bot sin Disk activo ✅')
  })
}
startBot()
