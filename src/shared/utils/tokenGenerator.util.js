import crypto from "node:crypto";

export const generateRandomToken = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

export const generatePrefixedToken = (prefix, bytes = 16) =>
  `${prefix}_${generateRandomToken(bytes)}`;

export const generateNumericToken = (length = 6) => {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;

  return String(crypto.randomInt(min, max + 1));
};
