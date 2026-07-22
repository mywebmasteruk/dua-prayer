export function normalizeChannelHandle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
}

export function channelHandleFromName(name: string) {
  return normalizeChannelHandle(name);
}
