import express from "express"
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys"
import QRCode from "qrcode"

const app = express()
app.use(express.json())

const sessions = {}

async function startSession(botId) {
  if (sessions[botId]?.status === "connected" || sessions[botId]?.status === "waiting_qr") {
    return sessions[botId]
  }

  const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${botId}`)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true
  })

  sessions[botId] = {
    sock,
    qr: null,
    status: "connecting"
  }

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", async (update) => {
    console.log("connection.update:", JSON.stringify(update, null, 2))

    const { connection, qr, lastDisconnect } = update

    if (qr) {
      try {
        const qrImage = await QRCode.toDataURL(qr)
        sessions[botId].qr = qrImage
        sessions[botId].status = "waiting_qr"
        console.log(`QR generado para ${botId}`)
      } catch (err) {
        console.error("Error generando QR:", err)
      }
    }

    if (connection === "open") {
      sessions[botId].status = "connected"
      sessions[botId].qr = null
      console.log(`Bot ${botId} conectado`)
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      console.log(`Conexión cerrada para ${botId}. Código:`, statusCode)

      const loggedOut = statusCode === DisconnectReason.loggedOut

      if (loggedOut) {
        sessions[botId].status = "disconnected"
        sessions[botId].qr = null
        console.log(`Bot ${botId} quedó desconectado por logout`)
      } else {
        sessions[botId].status = "reconnecting"
        console.log(`Reintentando conexión para ${botId}...`)
        setTimeout(() => {
          startSession(botId).catch(console.error)
        }, 3000)
      }
    }
  })

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages?.[0]
    if (!msg?.message) return

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "[mensaje no textual]"

    console.log("Mensaje recibido:", text)
  })

  return sessions[botId]
}

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "whatsapp-engine" })
})

app.post("/session/start", async (req, res) => {
  try {
    const { botId } = req.body

    if (!botId) {
      return res.status(400).json({ error: "botId es requerido" })
    }

    await startSession(botId)
    res.json({ ok: true })
  } catch (error) {
    console.error("Error en /session/start:", error)
    res.status(500).json({ error: error.message })
  }
})

app.get("/session/:botId/qr", (req, res) => {
  const session = sessions[req.params.botId]
  res.json({ qr: session?.qr || null })
})

app.get("/session/:botId/status", (req, res) => {
  const session = sessions[req.params.botId]
  res.json({ status: session?.status || "not_found" })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor WhatsApp corriendo en puerto ${PORT}`)
})
