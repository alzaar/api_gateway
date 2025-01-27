import http from "node:http";

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.write(JSON.stringify({ message: "hello from proxy" }));
  res.end();
});

server.listen(4000, () => console.log("Proxy server listening on 4000"));
