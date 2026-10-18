const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const P = require('pino')
require('./config.js')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        browser: ['AlexFury Bot', 'Chrome', '1.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true)
            if (shouldReconnect) startBot()
        } else if (connection === 'open') {
            console.log('ALEXFURY BOT CONECTADO')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message || m.key.fromMe) return
        
        const from = m.key.remoteJid
        const body = m.message.conversation || m.message.extendedTextMessage?.text || ''
        if (!body.startsWith(global.prefix)) return

        const args = body.slice(1).trim().split(/ +/)
        const command = args.shift().toLowerCase()

        if (command === 'menu' || command === 'help') {
            await sock.sendMessage(from, { text: `╭─ *ALEXFURY BOT* ─╮\n│ .menu\n│ .ping\n│ .owner\n╰─────────────╯` })
        }
        if (command === 'ping') {
            await sock.sendMessage(from, { text: 'Pong! 🏓 200ms' })
        }
        if (command === 'owner') {
            await sock.sendMessage(from, { text: `Dueño: wa.me/${global.owner[0]}` })
        }
    })
}

startBot()
