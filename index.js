import express from "express"

const app = express()
app.use(express.json())

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "running" })
})

app.post("/session/start", (req, res) => {
  res.json({ ok: true, body: req.body })
})

app.get("/session/:botId/status", (req, res) => {
  res.json({ status: "ok", botId: req.params.botId })
})

// 🔥 IMPORTANTE: usar 0.0.0.0
const PORT = process.env.PORT || 3000

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})
