import { fiveThousandUsers } from "./common.js";
import { pack, unpack } from "msgpackr";

export const msgpackrFiveThousandUsers = () => pack(fiveThousandUsers);

const encoded = msgpackrFiveThousandUsers();

export const msgpackrFiveThousandUsersDecode = () => unpack(encoded);
