import http from "http"

const PORT = process.env.PORT || 3000
const HOST = "0.0.0.0"

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json")

  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200)
    res.end(JSON.stringify({ ok: true, service: "running" }))
    return
  }

  if (req.method === "GET" && req.url.startsWith("/session/")) {
    const parts = req.url.split("/")
    const botId = parts[2] || null
    const last = parts[3] || null

    if (last === "status") {
      res.writeHead(200)
      res.end(JSON.stringify({ status: "ok", botId }))
      return
    }

    res.writeHead(404)
    res.end(JSON.stringify({ error: "not_found" }))
    return
  }

  if (req.method === "POST" && req.url === "/session/start") {
    let body = ""

    req.on("data", chunk => {
      body += chunk.toString()
    })

    req.on("end", () => {
      res.writeHead(200)
      res.end(JSON.stringify({ ok: true, rawBody: body }))
    })

    return
  }

  res.writeHead(404)
  res.end(JSON.stringify({ error: "not_found" }))
})

server.listen(PORT, HOST, () => {
  console.log(`HTTP server escuchando en ${HOST}:${PORT}`)
})

process.on("uncaughtException", err => {
  console.error("uncaughtException:", err)
})

process.on("unhandledRejection", err => {
  console.error("unhandledRejection:", err)
})

setInterval(() => {
  console.log("heartbeat", new Date().toISOString())
}, 15000)
