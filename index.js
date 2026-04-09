import express from "express"
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys"
import QRCode from "qrcode"

const app = express()
app.use(express.json())

const sessions = {}

async function startSession(botId) {
  const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${botId}`)

  const sock = makeWASocket({
    auth: state
  })

  sessions[botId] = { sock, qr: null, status: "connecting" }

  sock.ev.on("connection.update", async (update) => {
    const { qr, connection } = update

    if (qr) {
      const qrImage = await QRCode.toDataURL(qr)
      sessions[botId].qr = qrImage
      sessions[botId].status = "waiting_qr"
    }

    if (connection === "open") {
      sessions[botId].status = "connected"
      console.log(`Bot ${botId} conectado`)
    }

    if (connection === "close") {
      sessions[botId].status = "disconnected"
      console.log(`Bot ${botId} desconectado`)
    }
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text

    console.log("Mensaje recibido:", text)
  })
}

// iniciar sesión
app.post("/session/start", async (req, res) => {
  const { botId } = req.body
  await startSession(botId)
  res.json({ ok: true })
})

// obtener QR
app.get("/session/:botId/qr", (req, res) => {
  const session = sessions[req.params.botId]
  res.json({ qr: session?.qr || null })
})

// estado
app.get("/session/:botId/status", (req, res) => {
  const session = sessions[req.params.botId]
  res.json({ status: session?.status || "not_found" })
})

app.listen(3000, () => {
  console.log("Servidor WhatsApp corriendo en puerto 3000")
})
