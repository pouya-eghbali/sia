import { fiveThousandUsers } from "./common.js";
import { sia, desia } from "sializer";

export const siaOneFiveThousandUsers = () => sia(fiveThousandUsers);

const encoded = siaOneFiveThousandUsers();

export const siaOneFiveThousandUsersDecode = () => desia(encoded);
