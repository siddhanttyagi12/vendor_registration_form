const BASE = '';

async function asJson(res) {
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const msg =
      (body && body.detail && (body.detail.errors?.join('; ') || body.detail)) ||
      (typeof body === 'string' ? body : `HTTP ${res.status}`);
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return body;
}

export async function submitVendor(payload, files) {
  const fd = new FormData();
  fd.append('payload', JSON.stringify(payload));
  for (const [field, file] of Object.entries(files)) {
    if (file) fd.append(field, file);
  }
  const res = await fetch(`${BASE}/api/vendors`, { method: 'POST', body: fd });
  return asJson(res);
}
