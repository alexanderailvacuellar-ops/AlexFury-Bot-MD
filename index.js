import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 10000
app.get('/', (req,res) => res.send('AlexFury Bot Activo'))
app.listen(PORT, () => console.log('Puerto ' + PORT))

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['AlexFury','Chrome','1.0.0']
  })
  sock.ev.on('creds.update', saveCreds)
  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      const code = await sock.requestPairingCode('573227624844')
      console.log('TU CODIGO ES: ' + code)
    }, 4000)
  }
  sock.ev.on('connection.update', (u) => {
    if (u.connection === 'open') console.log('CONECTADO!')
  })
}
startBot()
