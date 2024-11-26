import { Bench } from "tinybench";
import WebSocket from "ws";
import { Sia } from "../../../index.js";
import { pack } from "msgpackr";
import { encode } from "cbor-x";

const address = "0x1234567890123456789012345678901234567890";
const sia = new Sia();

const rpcRequest = {
  method: "getBalance",
  params: [address],
};

export const payloads = {
  sia: () =>
    sia
      .seek(0)
      .addAscii(rpcRequest.method)
      .addAscii(rpcRequest.params[0])
      .toUint8ArrayReference(),
  json: () => new Uint8Array(Buffer.from(JSON.stringify(rpcRequest))),
  cbor: () => new Uint8Array(encode(rpcRequest)),
  msgpack: () => new Uint8Array(pack(rpcRequest)),
};

const clients = {
  sia: new WebSocket("ws://localhost:8080"),
  cbor: new WebSocket("ws://localhost:8081"),
  msgpack: new WebSocket("ws://localhost:8082"),
  json: new WebSocket("ws://localhost:8083"),
};

console.log("Waiting for connections...");
await new Promise((resolve) => setTimeout(resolve, 15 * 1000));

const bench = new Bench({ name: "RPC", time: 10 * 1000 });

const makeRpcCall = async (ws: WebSocket, payload: Uint8Array) =>
  new Promise((resolve) => {
    ws.send(payload, { binary: true });
    const done = () => {
      ws.off("message", done);
      resolve(null);
    };
    ws.on("message", done);
  });

bench
  .add("JSON", async () => await makeRpcCall(clients.json, payloads.json()))
  .addEventListener("complete", () => clients.json.close());

bench
  .add("Sia", async () => await makeRpcCall(clients.sia, payloads.sia()))
  .addEventListener("complete", () => clients.sia.close());

bench
  .add("CBOR", async () => await makeRpcCall(clients.cbor, payloads.cbor()))
  .addEventListener("complete", () => clients.cbor.close());

bench
  .add(
    "MsgPack",
    async () => await makeRpcCall(clients.msgpack, payloads.msgpack())
  )
  .addEventListener("complete", () => clients.msgpack.close());

console.log(`Running ${bench.name} benchmark...`);
await bench.run();

console.table(bench.table());
