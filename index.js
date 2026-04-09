import express from "express"

const app = express()
app.use(express.json())

app.get("/", (_req, res) => {
  res.json({ ok: true })
})

app.post("/session/start", (req, res) => {
  res.json({ ok: true, body: req.body })
})

app.get("/session/:botId/status", (req, res) => {
  res.json({ status: "ok", botId: req.params.botId })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})
