import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import P from 'pino'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 3000
app.get('/', (req, res) => res.send('AlexFury Bot Activo'))
app.listen(PORT, () => console.log(`Puerto ${PORT} abierto`))

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        browser: ['AlexFury', 'Chrome', '1.0.0']
    })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        if (qr) console.log(qr)
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) startBot()
        } else if (connection === 'open') {
            console.log('CONECTADO!')
        }
    })
}
startBot()
