export async function signingRequest(path, body, admin = false) {
  let response;
  try {
    response = await fetch(`/api/v1/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...(admin ? { Authorization: `Bearer ${sessionStorage.getItem('quotation_admin_token') || ''}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch { throw new Error('The signing service is unavailable. Please try again.'); }
  let data;
  try { data = await response.json(); } catch { throw new Error('The signing service is unavailable. Please check the sharing server configuration.'); }
  if (!response.ok) throw Object.assign(new Error(data.message || 'Unable to complete signing.'), { status: response.status });
  return data;
}

