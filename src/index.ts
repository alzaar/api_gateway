import "dotenv/config";
import http from "node:http";
import https from "node:https";
import express, { Request, Response } from "express";

const app = express();

app.get("/", (req: Request, res: Response) => {
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

app.listen(process.env.PORT, () => console.log("Listening on 8000"));
