const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  // If body is not FormData, ensure Content-Type is json
  if (!(options.body instanceof FormData) && options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Inject admin token if exists
  const token = localStorage.getItem('urimai_admin_token');
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    if (!res.ok) {
      let errorMsg = `Server error: ${res.status}`;
      try {
        const errorData = await res.json();
        errorMsg = errorData.detail || errorMsg;
      } catch (e) {
        // Not JSON
      }
      const err = new Error(errorMsg);
      err.status = res.status;
      throw err;
    }

    return await res.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const connErr = new Error('Cannot connect to backend server. Please verify FastAPI is running at ' + API_BASE);
      connErr.isNetworkError = true;
      throw connErr;
    }
    throw error;
  }
}
