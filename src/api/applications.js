import { apiRequest } from './client';

export function trackApplication(deviceId, schemeId, status = 'pending') {
  return apiRequest('/api/applications', {
    method: 'POST',
    body: JSON.stringify({
      device_id: deviceId,
      scheme_id: schemeId,
      status
    })
  });
}

export function getApplications(deviceId) {
  return apiRequest(`/api/applications?device_id=${encodeURIComponent(deviceId)}`);
}

export function updateApplicationStatus(appId, status) {
  return apiRequest(`/api/applications/${appId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export function getUpcomingReminders(deviceId) {
  return apiRequest(`/api/reminders/upcoming?device_id=${encodeURIComponent(deviceId)}`);
}
