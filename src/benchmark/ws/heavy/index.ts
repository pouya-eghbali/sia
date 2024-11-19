import { Bench } from "tinybench";
import WebSocket from "ws";
import { Sia } from "../../../index.js";
import { pack, unpack } from "msgpackr";
import { decode, encode } from "cbor-x";
import { fiveHundredUsers } from "../../tests/common.js";

const sia = new Sia();

const rpcRequest = {
  method: "batchCalculateUserAges",
  params: fiveHundredUsers,
};

export const payloads = {
  sia: () =>
    sia
      .seek(0)
      .addAscii(rpcRequest.method)
      .addArray16(rpcRequest.params, (sia, user) => {
        sia
          .addAscii(user.userId)
          .addAscii(user.username)
          .addAscii(user.email)
          .addAscii(user.avatar)
          .addAscii(user.password)
          .addInt64(user.birthdate.getTime())
          .addInt64(user.registeredAt.getTime());
      })
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

const callbacks = {
  sia: (data: Buffer) => {
    return new Sia(new Uint8Array(data)).readArray16((sia) => {
      const userId = sia.readAscii();
      const age = sia.readUInt8();
      return { userId, age };
    });
  },
  cbor: (data: Buffer) => decode(data),
  msgpack: (data: Buffer) => unpack(data),
  json: (data: Buffer) => JSON.parse(data.toString()),
};

console.log("Waiting for connections...");
await new Promise((resolve) => setTimeout(resolve, 15 * 1000));

const bench = new Bench({ name: "RPC", time: 10 * 1000 });

const makeRpcCall = async (
  ws: WebSocket,
  ondata: (data: Buffer) => void,
  payload: Uint8Array
) =>
  new Promise((resolve) => {
    ws.send(payload, { binary: true });
    const done = (data: Buffer) => {
      ws.off("message", done);
      ondata(data);
      resolve(null);
    };
    ws.on("message", done);
  });

bench
  .add(
    "JSON",
    async () => await makeRpcCall(clients.json, callbacks.json, payloads.json())
  )
  .addEventListener("complete", () => clients.json.close());

bench
  .add(
    "Sia",
    async () => await makeRpcCall(clients.sia, callbacks.sia, payloads.sia())
  )
  .addEventListener("complete", () => clients.sia.close());

bench
  .add(
    "CBOR",
    async () => await makeRpcCall(clients.cbor, callbacks.cbor, payloads.cbor())
  )
  .addEventListener("complete", () => clients.cbor.close());

bench
  .add(
    "MsgPack",
    async () =>
      await makeRpcCall(clients.msgpack, callbacks.msgpack, payloads.msgpack())
  )
  .addEventListener("complete", () => clients.msgpack.close());

console.log(`Running ${bench.name} benchmark...`);
await bench.run();

console.table(bench.table());
