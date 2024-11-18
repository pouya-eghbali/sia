import { Bench } from "tinybench";
import {
  siaFiveThousandUsers,
  siaFiveThousandUsersDecode,
} from "./tests/sia.js";
import {
  jsonFiveThousandUsers,
  jsonFiveThousandUsersDecode,
} from "./tests/json.js";
import {
  cborFiveThousandUsers,
  cborFiveThousandUsersDecode,
} from "./tests/cbor.js";
import {
  siaOneFiveThousandUsers,
  siaOneFiveThousandUsersDecode,
} from "./tests/sia-v1.js";
import {
  msgpackrFiveThousandUsers,
  msgpackrFiveThousandUsersDecode,
} from "./tests/msgpackr.js";

const bench = new Bench({ name: "serialization", time: 2 * 1000 });

bench.add("JSON", () => jsonFiveThousandUsers());
bench.add("Sializer", () => siaFiveThousandUsers());
bench.add("Sializer (v1)", () => siaOneFiveThousandUsers());
bench.add("CBOR-X", () => cborFiveThousandUsers());
bench.add("MsgPackr", () => msgpackrFiveThousandUsers());

console.log(`Running ${bench.name} benchmark...`);
await bench.run();

console.table(bench.table());

const deserializeBench = new Bench({
  name: "deserialization",
  time: 2 * 1000,
});

deserializeBench.add("JSON", () => jsonFiveThousandUsersDecode());
deserializeBench.add("Sializer", () => siaFiveThousandUsersDecode());
deserializeBench.add("Sializer (v1)", () => siaOneFiveThousandUsersDecode());
deserializeBench.add("CBOR-X", () => cborFiveThousandUsersDecode());
deserializeBench.add("MsgPackr", () => msgpackrFiveThousandUsersDecode());

console.log(`Running ${deserializeBench.name} benchmark...`);
await deserializeBench.run();

console.table(deserializeBench.table());

console.log("Sia file size:", siaFiveThousandUsers().length);
console.log("Sia v1 file size:", siaOneFiveThousandUsers().length);
console.log("JSON file size:", jsonFiveThousandUsers().length);
console.log("MsgPackr file size:", cborFiveThousandUsers().length);
console.log("CBOR-X file size:", msgpackrFiveThousandUsers().length);
