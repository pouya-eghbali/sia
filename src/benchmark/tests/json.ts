import { fiveThousandUsers } from "./common.js";

export const jsonFiveThousandUsers = () =>
  Buffer.from(JSON.stringify(fiveThousandUsers));
