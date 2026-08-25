export function contentHash(value: string) {
  return Buffer.from(value).toString("base64url").slice(0, 48);
}
