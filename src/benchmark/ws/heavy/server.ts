import { WebSocketServer } from "ws";
import { Sia } from "../../../index.js";
import { pack, unpack } from "msgpackr";
import { encode, decode } from "cbor-x";

const sia = new Sia();

type User = { userId: string; birthdate: Date };

const getUserAge = (user: User) => ({
  userId: user.userId,
  age: new Date().getFullYear() - user.birthdate.getFullYear(),
});

const BASE_PORT = 8080;

console.log("Starting Sia WS server on port", BASE_PORT);
const siaWss = new WebSocketServer({ port: BASE_PORT + 0 });
siaWss.on("connection", function connection(ws) {
  ws.on("error", console.error);
  ws.on("message", (data) => {
    // Read and skip method name
    sia.setContent(data as Buffer).readAscii();
    const users = sia.readArray16((sia: Sia) => {
      const userId = sia.readAscii();
      sia.readAscii(); // username
      sia.readAscii(); // email
      sia.readAscii(); // avatar
      sia.readAscii(); // password
      const birthdate = new Date(sia.readInt64());
      sia.readInt64(); // registeredAt
      return { userId, birthdate };
    });
    const ages = users.map(getUserAge);
    const payload = sia
      .seek(0)
      .addArray16(ages, (sia: Sia, age) => {
        sia.addAscii(age.userId).addUInt8(age.age);
      })
      .toUint8ArrayReference();
    ws.send(payload, { binary: true });
  });
});

console.log("Starting CBOR WS server on port", BASE_PORT + 1);
const cborWss = new WebSocketServer({ port: BASE_PORT + 1 });
cborWss.on("connection", function connection(ws) {
  ws.on("error", console.error);
  ws.on("message", (data) => {
    const users = decode(data as Buffer).params;
    const ages = users.map(getUserAge);
    const payload = encode(ages);
    ws.send(payload, { binary: true });
  });
});

console.log("Starting MsgPack WS server on port", BASE_PORT + 2);
const msgpackWss = new WebSocketServer({ port: BASE_PORT + 2 });
msgpackWss.on("connection", function connection(ws) {
  ws.on("error", console.error);
  ws.on("message", (data) => {
    const users = unpack(data as Buffer).params;
    const ages = users.map(getUserAge);
    const payload = pack(ages);
    ws.send(payload, { binary: true });
  });
});

console.log("Starting JSON WS server on port", BASE_PORT + 3);
const jsonWss = new WebSocketServer({ port: BASE_PORT + 3 });
jsonWss.on("connection", function connection(ws) {
  ws.on("error", console.error);
  ws.on("message", (data) => {
    const users = JSON.parse(data.toString()).params;
    const ages = users
      .map((user: User) => ({ ...user, birthdate: new Date(user.birthdate) }))
      .map(getUserAge);
    const payload = new Uint8Array(Buffer.from(JSON.stringify(ages)));
    ws.send(payload);
  });
});
