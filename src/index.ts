import "dotenv/config";

import http from "node:http";
import https from "node:https";

import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';
import express, { Request, Response } from "express";

const SECRET_KEY = process.env.SECRET_KEY || "some_secret_12345"

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }

  if (username !== process.env.USERNAME || password !== process.env.PASSWORD) {
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }

  const token = jwt.sign({ id: uuidv4(), username }, SECRET_KEY, { expiresIn: "1h" })
  
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  })

  res.json({ message: "Login successful!" })
  return
});

app.use("/", (req: Request, res: Response) => {
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
