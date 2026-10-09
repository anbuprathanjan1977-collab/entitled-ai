import { apiRequest } from './client';

export function adminLogin(email, password) {
  return apiRequest('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export function getAdminSchemes() {
  return apiRequest('/api/admin/schemes');
}

export function createAdminScheme(schemeData) {
  return apiRequest('/api/admin/schemes', {
    method: 'POST',
    body: JSON.stringify(schemeData)
  });
}

export function updateAdminScheme(id, schemeData) {
  return apiRequest(`/api/admin/schemes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(schemeData)
  });
}

export function deleteAdminScheme(id) {
  return apiRequest(`/api/admin/schemes/${id}`, {
    method: 'DELETE'
  });
}

export function getPolicyChanges(statusFilter) {
  const query = statusFilter ? `?status_filter=${statusFilter}` : '';
  return apiRequest(`/api/admin/changes${query}`);
}

export function approvePolicyChange(changeId) {
  return apiRequest(`/api/admin/changes/${changeId}/approve`, {
    method: 'POST'
  });
}

export function rejectPolicyChange(changeId) {
  return apiRequest(`/api/admin/changes/${changeId}/reject`, {
    method: 'POST'
  });
}

export function triggerCheckNow() {
  return apiRequest('/api/admin/check-now', {
    method: 'POST'
  });
}

export function triggerSimulateChange(schemeId) {
  const query = schemeId ? `?scheme_id=${schemeId}` : '';
  return apiRequest(`/api/admin/demo-simulate-change${query}`, {
    method: 'POST'
  });
}
