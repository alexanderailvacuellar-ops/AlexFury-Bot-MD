import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import express from 'express'
import QRCode from 'qrcode'

const app = express()
let lastQR = null
const PORT = process.env.PORT || 10000

app.get('/', async (req,res) => {
  if (!lastQR) return res.send('<h1>AlexFury Bot Activo</h1><p>Esperando QR... recarga en 5 seg</p><script>setTimeout(()=>location.reload(),5000)</script>')
  const img = await QRCode.toDataURL(lastQR)
  res.send(`<h1>Escanea este QR con el 322</h1><img src="${img}" style="width:300px"/><p>Se actualiza solo</p><script>setTimeout(()=>location.reload(),10000)</script>`)
})

app.listen(PORT, () => console.log('Puerto ' + PORT))

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true
  })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', async (u) => {
    const { qr, connection } = u
    if (qr) {
      lastQR = qr
      console.log('NUEVO QR GENERADO - ve a tu link de Render para escanearlo')
    }
    if (connection === 'open') {
      console.log('CONECTADO!')
      lastQR = null
    }
    if (connection === 'close') {
      const shouldReconnect = u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) setTimeout(startBot, 3000)
    }
  })
}
startBot()
