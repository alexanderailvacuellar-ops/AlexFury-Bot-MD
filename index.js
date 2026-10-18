import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 3000
app.get('/', (req, res) => res.send('AlexFury Bot Activo'))
app.listen(PORT, () => console.log('Puerto ' + PORT + ' abierto'))

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({ 
    auth: state, 
    logger: pino({ level: 'silent' }), 
    browser: ['AlexFury', 'Chrome', '1.0.0'] 
  })
  
  sock.ev.on('creds.update', saveCreds)

  if (!sock.authState.creds.registered) {
    const num = '573227624844'
    setTimeout(async () => {
      const code = await sock.requestPairingCode(num)
      console.log('TU CODIGO ES: ', code)
    }, 3000)
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const r = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      if (r) {
        console.log('Reconectando...')
        startBot()
      }
    } else if (connection === 'open') {
      console.log('CONECTADO!')
    }
  })
}

startBot()
