import "dotenv/config";
import http from "node:http";
import https from "node:https";
import express from "express";

const app = express();

app.use("/", (req, res) => {
  const targetUrl = process.env.PROXY_SERVER_URL || "";
  const parsedUrl = new URL(targetUrl);

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === "https" ? 443 : 80),
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const protocol = parsedUrl.protocol === "https" ? https : http;

  const proxyReq = protocol.request(
    options,
    (proxyRes: http.IncomingMessage) => {
      const statusCode = proxyRes.statusCode || 500;
      res.writeHead(statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );

  req.pipe(proxyReq, { end: true });

  proxyReq.on("error", (err) => {
    console.error(err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ message: "Internal server error" }));
  });
});

// const server = http.createServer(
//   (req: http.IncomingMessage, res: http.ServerResponse) => {

//   }
// );

// server.listen(process.env.PORT, () =>
// console.log(`Listening on ${process.env.PORT}`)
// );

app.listen(process.env.PORT, () =>
  console.log(`Listening on PORT: ${process.env.PORT}`)
);
