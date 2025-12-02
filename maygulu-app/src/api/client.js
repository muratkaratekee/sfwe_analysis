// Centralized API client
const envBase = process.env.REACT_APP_API_BASE_URL;
if (!envBase) {
  throw new Error('REACT_APP_API_BASE_URL is not set. Define it in a .env file at project root.');
}
export const API_BASE = envBase;

async function handleJson(res) {
  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) throw new Error((data && data.error) || 'Request failed');
  return data;
}

export const getJson = async (pathOrUrl) => {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
  const res = await fetch(url);
  return handleJson(res);
};

export const postJson = async (pathOrUrl, body) => {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  return handleJson(res);
};

export const putJson = async (pathOrUrl, body) => {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  return handleJson(res);
};

export const del = async (pathOrUrl) => {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
  const res = await fetch(url, { method: 'DELETE' });
  return handleJson(res);
};

export const postForm = async (pathOrUrl, formData) => {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
  const res = await fetch(url, { method: 'POST', body: formData });
  return handleJson(res);
};
