import { fiveThousandUsers } from "./common.js";
import { encode, decode } from "cbor-x";

export const cborFiveThousandUsers = () => encode(fiveThousandUsers);

const encoded = cborFiveThousandUsers();

export const cborFiveThousandUsersDecode = () => decode(encoded);
