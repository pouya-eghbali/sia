import { fiveThousandUsers } from "./common.js";
import { Sia } from "../../index.js";

const sia = new Sia();

export const siaFiveThousandUsers = () =>
  sia
    .seek(0)
    .addArray16(fiveThousandUsers, (sia, user) => {
      sia.addString8(user.userId);
      sia.addString8(user.username);
      sia.addString8(user.email);
      sia.addString8(user.avatar);
      sia.addString8(user.password);
      sia.addUInt32(user.birthdate.valueOf());
      sia.addUInt32(user.registeredAt.valueOf());
    })
    .toUint8ArrayReference();
