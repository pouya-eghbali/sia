import { fiveThousandUsers } from "./common.js";

export const jsonFiveThousandUsers = () =>
  Buffer.from(JSON.stringify(fiveThousandUsers));

const encoded = jsonFiveThousandUsers();

export const jsonFiveThousandUsersDecode = () => JSON.parse(encoded.toString());
