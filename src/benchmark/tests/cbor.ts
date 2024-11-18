import { fiveThousandUsers } from "./common.js";
import { encode } from "cbor-x";

export const cborFiveThousandUsers = () => encode(fiveThousandUsers);
