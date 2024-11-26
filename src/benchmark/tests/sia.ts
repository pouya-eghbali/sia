import { fiveThousandUsers } from "./common.js";
import { Sia } from "../../index.js";
import assert from "assert";

const sia = new Sia();

export const siaFiveThousandUsers = () =>
  sia
    .seek(0)
    .addArray16(fiveThousandUsers, (sia, user) => {
      sia
        .addAscii(user.userId)
        .addAscii(user.username)
        .addAscii(user.email)
        .addAscii(user.avatar)
        .addAscii(user.password)
        .addInt64(user.birthdate.valueOf())
        .addInt64(user.registeredAt.valueOf());
    })
    .toUint8ArrayReference();

const encoded = siaFiveThousandUsers();
const desia = new Sia(encoded);

const decodeUser = (sia: Sia) => ({
  userId: sia.readAscii(),
  username: sia.readAscii(),
  email: sia.readAscii(),
  avatar: sia.readAscii(),
  password: sia.readAscii(),
  birthdate: new Date(sia.readInt64()),
  registeredAt: new Date(sia.readInt64()),
});

export const siaFiveThousandUsersDecode = () =>
  desia.seek(0).readArray16(decodeUser);
