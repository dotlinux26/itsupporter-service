export function ok<T>(res: { json: (body: unknown) => unknown }, data: T, message?: string) {
  return res.json({ success: true, message, data });
}

export function created<T>(res: { json: (body: unknown) => unknown }, data: T, message?: string) {
  return res.json({ success: true, message, data });
}