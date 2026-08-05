import bcrypt from "bcrypt";
import crypto from "node:crypto";

const SALT_ROUNDS = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
