import { fiveThousandUsers } from "./common.js";
import { pack } from "msgpackr";

export const msgpackrFiveThousandUsers = () => pack(fiveThousandUsers);
