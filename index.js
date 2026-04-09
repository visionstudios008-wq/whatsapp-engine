import express from "express"
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys"
import QRCode from "qrcode"

const app = express()
app.use(express.json())

const sessions = {}

async function startSession(botId) {
  console.log("Iniciando sesión:", botId)

  const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${botId}`)

  const sock = makeWASocket({
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
    console.log("UPDATE:", update)

    const { connection, qr, lastDisconnect } = update

    if (qr) {
      const qrImage = await QRCode.toDataURL(qr)
      sessions[botId].qr = qrImage
      sessions[botId].status = "waiting_qr"
      console.log("QR generado")
    }

    if (connection === "open") {
      sessions[botId].status = "connected"
      sessions[botId].qr = null
      console.log("Conectado")
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode

      if (code !== DisconnectReason.loggedOut) {
        console.log("Reconectando...")
        setTimeout(() => startSession(botId), 3000)
      } else {
        sessions[botId].status = "disconnected"
      }
    }
  })
}

app.get("/", (_req, res) => {
  res.json({ ok: true })
})

app.post("/session/start", async (req, res) => {
  try {
    const { botId } = req.body
    await startSession(botId)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.get("/session/:botId/qr", (req, res) => {
  const s = sessions[req.params.botId]
  res.json({ qr: s?.qr || null })
})

app.get("/session/:botId/status", (req, res) => {
  const s = sessions[req.params.botId]
  res.json({ status: s?.status || "not_found" })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})
process.on("unhandledRejection", err => {
  console.error("unhandledRejection:", err)
})
