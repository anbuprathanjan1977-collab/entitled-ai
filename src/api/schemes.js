import { apiRequest } from './client';

export function getStates() {
  return apiRequest('/api/states');
}

export function getDistricts(state) {
  const query = state ? `?state=${encodeURIComponent(state)}` : '';
  return apiRequest(`/api/districts${query}`);
}

export function getSchemes(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/api/schemes${query ? '?' + query : ''}`);
}

export function getSchemeById(id) {
  return apiRequest(`/api/schemes/${id}`);
}

export function explainScheme(schemeId, language = 'en') {
  return apiRequest('/api/explain', {
    method: 'POST',
    body: JSON.stringify({ scheme_id: schemeId, language })
  });
}
