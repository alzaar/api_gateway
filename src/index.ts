import http from "node:http";

const PORT = 8000;

const server = http.createServer((req, res) => {
  const targetUrl = "http://localhost:4000";
  const parsedUrl = new URL(targetUrl);

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || 80,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes: http.IncomingMessage) => {
    const statusCode = proxyRes.statusCode || 500;
    res.writeHead(statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  req.pipe(proxyReq, { end: true });

  proxyReq.on("error", (err) => {
    console.error(err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ message: "Internal server error" }));
  });
});

server.listen(PORT, () => console.log(`Listening on PORT: ${PORT}`));
