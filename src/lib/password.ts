import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

const COST = 16384;
const SALT_BYTES = 16;
const KEY_BYTES = 64;

function scrypt(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      keylen,
      options,
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      },
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = await scrypt(password.normalize("NFKC"), salt, KEY_BYTES, {
    N: COST,
  });
  return `scrypt$${COST}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;

  const cost = Number(parts[1]);
  const salt = Buffer.from(parts[2], "hex");
  const expected = Buffer.from(parts[3], "hex");
  if (
    !Number.isSafeInteger(cost) ||
    cost < 2 ||
    salt.length === 0 ||
    expected.length === 0
  ) {
    return false;
  }

  const derived = await scrypt(
    password.normalize("NFKC"),
    salt,
    expected.length,
    { N: cost },
  );

  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
