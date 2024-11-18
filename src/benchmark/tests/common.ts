import { faker } from "@faker-js/faker";

export function createRandomUser() {
  return {
    userId: faker.string.uuid(),
    username: faker.internet.username(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    password: faker.internet.password(),
    birthdate: faker.date.birthdate(),
    registeredAt: faker.date.past(),
  };
}

export const fiveUsers = faker.helpers.multiple(createRandomUser, {
  count: 5,
});

export const fiveThousandUsers = faker.helpers.multiple(createRandomUser, {
  count: 5_000,
});
