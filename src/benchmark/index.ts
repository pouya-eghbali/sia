import { Bench } from "tinybench";
import { siaFiveThousandUsers } from "./tests/sia.js";
import { jsonFiveThousandUsers } from "./tests/json.js";
import { cborFiveThousandUsers } from "./tests/cbor.js";
import { siaOneFiveThousandUsers } from "./tests/sia-v1.js";
import { msgpackrFiveThousandUsers } from "./tests/msgpackr.js";

const bench = new Bench({ name: "serialization", time: 60 * 1000 });

bench.add("JSON", () => jsonFiveThousandUsers());
bench.add("Sializer", () => siaFiveThousandUsers());
bench.add("Sializer (v1)", () => siaOneFiveThousandUsers());
bench.add("CBOR-X", () => cborFiveThousandUsers());
bench.add("MsgPackr", () => msgpackrFiveThousandUsers());

console.log(`Running ${bench.name} benchmark...`);
await bench.run();

console.table(bench.table());

console.log("Sia file size:", siaFiveThousandUsers().length);
console.log("Sia v1 file size:", siaOneFiveThousandUsers().length);
console.log("JSON file size:", jsonFiveThousandUsers().length);
console.log("MsgPackr file size:", cborFiveThousandUsers().length);
console.log("CBOR-X file size:", msgpackrFiveThousandUsers().length);
