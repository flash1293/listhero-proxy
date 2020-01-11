const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const info = require("debug")("info");

  const proxyUrl = process.env.PROXY_URL || 'http://localhost:3001';

  const app = express();
  const expressWs = require("express-ws")(app);
  app.use(bodyParser.json({ type: "application/json", limit: "2mb" }));
  app.use(cors());
  app.post(
    "/token",
    (req, res) => {
      info("Forwarding token request");
      res.redirect(`${proxyUrl}/token`);
    }
  );

  app.post(
    "/api",
    async (req, res) => {
      info("Forwarding api request");
      res.redirect(`${proxyUrl}/api`);
    }
  );

  app.get("/api/updates/:session", (ws, req) => {
    info("Forwarding websocket session request");
    res.redirect(`${proxyUrl}${req.path}`);
  });

  const port = process.env.PORT || 3002;
  const server = app.listen(port, () =>
    info(`Ekofe proxy server listening on port ${port}! Forwarding all requests to ${proxyUrl}`)
  );

  process.on("SIGTERM", function() {
    server.close(function() {
      process.exit(0);
    });
  });
