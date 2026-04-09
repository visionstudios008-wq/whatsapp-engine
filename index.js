import http from "http"

const PORT = process.env.PORT || 3000
const HOST = "0.0.0.0"

const server = http.createServer((req, res) => {
  console.log("REQUEST:", req.method, req.url)

  res.setHeader("Content-Type", "application/json")
  res.writeHead(200)
  res.end(JSON.stringify({ ok: true, url: req.url }))
})

server.listen(PORT, HOST, () => {
  console.log(`HTTP server escuchando en ${HOST}:${PORT}`)
})

setInterval(() => {
  console.log("heartbeat", new Date().toISOString())
}, 15000)

process.on("uncaughtException", err => {
  console.error("uncaughtException:", err)
})

process.on("unhandledRejection", err => {
  console.error("unhandledRejection:", err)
})
