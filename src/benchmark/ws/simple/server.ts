import { WebSocketServer } from "ws";
import { Sia } from "../../../index.js";
import { pack, unpack } from "msgpackr";
import { encode, decode } from "cbor-x";

const address = "0x1234567890123456789012345678901234567890";
const map = new Map([[address, Number.MAX_SAFE_INTEGER]]);

const getAccountBalance = (address: string) => map.get(address) || 0;
const sia = new Sia();

const BASE_PORT = 8080;

console.log("Starting Sia WS server on port", BASE_PORT);
const siaWss = new WebSocketServer({ port: BASE_PORT + 0 });
siaWss.on("connection", function connection(ws) {
  ws.on("error", console.error);
  ws.on("message", (data) => {
    // Read and skip method name
    sia.setContent(data as Buffer).readAscii();
    const address = sia.readAscii();
    const balance = getAccountBalance(address);
    const payload = sia.seek(0).addInt64(balance).toUint8ArrayReference();
    ws.send(payload, { binary: true });
  });
});

console.log("Starting CBOR WS server on port", BASE_PORT + 1);
const cborWss = new WebSocketServer({ port: BASE_PORT + 1 });
cborWss.on("connection", function connection(ws) {
  ws.on("error", console.error);
  ws.on("message", (data) => {
    const address = decode(data as Buffer).params[0];
    const balance = getAccountBalance(address);
    const payload = encode({ balance });
    ws.send(payload, { binary: true });
  });
});

console.log("Starting MsgPack WS server on port", BASE_PORT + 2);
const msgpackWss = new WebSocketServer({ port: BASE_PORT + 2 });
msgpackWss.on("connection", function connection(ws) {
  ws.on("error", console.error);
  ws.on("message", (data) => {
    const address = unpack(data as Buffer).params[0];
    const balance = getAccountBalance(address);
    const payload = pack({ balance });
    ws.send(payload, { binary: true });
  });
});

console.log("Starting JSON WS server on port", BASE_PORT + 3);
const jsonWss = new WebSocketServer({ port: BASE_PORT + 3 });
jsonWss.on("connection", function connection(ws) {
  ws.on("error", console.error);
  ws.on("message", (data) => {
    const address = JSON.parse(data.toString()).params[0];
    const balance = getAccountBalance(address);
    const payload = new Uint8Array(Buffer.from(JSON.stringify({ balance })));
    ws.send(payload);
  });
});
