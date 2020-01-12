const proxy = require("express-http-proxy");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const WebSocket = require('ws');
const info = require("debug")("info");
const error = require("debug")("error");

const proxyUrl = process.env.PROXY_URL || "http://localhost:3001";
const proxyWsUrl = proxyUrl.replace("http", "ws");

const app = express();
const expressWs = require("express-ws")(app);
app.use(bodyParser.json({ type: "application/json", limit: "2mb" }));
app.use(cors());
app.post("/token", function(req, res, next) {
  info(`${new Date()} Proxying token request`);
  next();
});
app.post("/api", function(req, res, next) {
  info(`${new Date()} Proxying api request`);
  next();
});
app.post(
  "/token",
  proxy(proxyUrl, {
    proxyReqPathResolver: () => "/token"
  })
);
app.post(
  "/api",
  proxy(proxyUrl, {
    proxyReqPathResolver: () => "/api"
  })
);

app.ws("/api/updates/:session", (ws, req) => {
  info(`${new Date()} Proxying web socket update connection`);
  const wsUrl = `${proxyWsUrl}/api/updates/${req.params.session}`;
  const proxyWs = new WebSocket(wsUrl, req.headers["sec-websocket-protocol"]);

  proxyWs.on("open", function() {
    info("Forwarded websocket connection established");
  });

  proxyWs.on("error", function(e) {
    error(e);
    ws.close();
  });

  proxyWs.on("message", function(data) {
    ws.send(data);
  });

  proxyWs.on("close", function() {
    ws.close();
  });

  ws.on("close", function() {
    proxyWs.close();
  });
});

const port = process.env.PORT || 3002;
const server = app.listen(port, () =>
  info(
    `Ekofe proxy server listening on port ${port}! Forwarding all requests to ${proxyUrl}`
  )
);

process.on("SIGTERM", function() {
  server.close(function() {
    process.exit(0);
  });
});
