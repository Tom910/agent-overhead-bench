export function hasHttp(s) {
  return s.startsWith("http://") || s.startsWith("https://");
}
export function hasFile(s) {
  return s.startsWith("file://");
}
