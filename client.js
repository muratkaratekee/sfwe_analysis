// Centralized API client
const envBase = process.env.REACT_APP_API_BASE_URL;
if (!envBase) {
  throw new Error('REACT_APP_API_BASE_URL is not set. Define it in a .env file at project root.');
}
export const API_BASE = envBase;

async function handleJson(res) {
  let data = null;
  try { data = await res.json(); } catch (_) { }
  if (!res.ok) {
    const err = new Error((data && data.error) || 'Request failed');
    try { err.status = res.status; } catch (_) { }
    throw err;
  }
  return data;
}

export const getJson = async (pathOrUrl) => {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
  try {
    const res = await fetch(url);
    return handleJson(res);
  } catch (error) {
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error(`Cannot connect to server. Please make sure the backend is running on ${API_BASE}`);
    }
    throw error;
  }
};

export const postJson = async (pathOrUrl, body) => {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    return handleJson(res);
  } catch (error) {
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error(`Cannot connect to server. Please make sure the backend is running on ${API_BASE}`);
    }
    throw error;
  }
};

export const putJson = async (pathOrUrl, body) => {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    return handleJson(res);
  } catch (error) {
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error(`Cannot connect to server. Please make sure the backend is running on ${API_BASE}`);
    }
    throw error;
  }
};

export const del = async (pathOrUrl) => {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
  try {
    const res = await fetch(url, { method: 'DELETE' });
    return handleJson(res);
  } catch (error) {
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error(`Cannot connect to server. Please make sure the backend is running on ${API_BASE}`);
    }
    throw error;
  }
};

export const postForm = async (pathOrUrl, formData) => {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
  try {
    const res = await fetch(url, { method: 'POST', body: formData });
    return handleJson(res);
  } catch (error) {
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error(`Cannot connect to server. Please make sure the backend is running on ${API_BASE}`);
    }
    throw error;
  }
};
