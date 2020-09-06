const http = require("http");
const WebSocket = require("ws");
const url = require("url");

const data = require("../lab/large-file.json");
const { Sia: SiaLab, sia: siaLab } = require("../lab");
const { Sia, sia } = require("..");

const server = http.createServer();
const JSONWS = new WebSocket.Server({ noServer: true });
const SIAWS = new WebSocket.Server({ noServer: true });
const SIASWS = new WebSocket.Server({ noServer: true });
const SIALWS = new WebSocket.Server({ noServer: true });
const SIALSWS = new WebSocket.Server({ noServer: true });

JSONWS.on("connection", function connection(ws) {
  const serialized = JSON.stringify(data);
  ws.send(serialized);
});

SIAWS.on("connection", function connection(ws) {
  const serialized = sia(data);
  ws.send(serialized);
});

SIASWS.on("connection", function connection(ws) {
  new Sia(data, (buf) => ws.send(buf), 1000).serialize();
});

SIALWS.on("connection", function connection(ws) {
  const serialized = siaLab(data);
  ws.send(serialized);
});

SIALSWS.on("connection", function connection(ws) {
  new SiaLab(data, (buf) => ws.send(buf), 1000).serialize();
});

server.on("upgrade", function upgrade(request, socket, head) {
  const pathname = url.parse(request.url).pathname;

  if (pathname === "/JSON") {
    JSONWS.handleUpgrade(request, socket, head, function done(ws) {
      JSONWS.emit("connection", ws, request);
    });
  } else if (pathname === "/SIA") {
    SIAWS.handleUpgrade(request, socket, head, function done(ws) {
      SIAWS.emit("connection", ws, request);
    });
  } else if (pathname === "/SIAS") {
    SIASWS.handleUpgrade(request, socket, head, function done(ws) {
      SIASWS.emit("connection", ws, request);
    });
  } else if (pathname === "/SIAL") {
    SIALWS.handleUpgrade(request, socket, head, function done(ws) {
      SIALWS.emit("connection", ws, request);
    });
  } else if (pathname === "/SIALS") {
    SIALSWS.handleUpgrade(request, socket, head, function done(ws) {
      SIALSWS.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(8080);
