import { apiRequest } from './client';

export function getGovtExams(params = {}) {
  const cleanParams = {};
  Object.keys(params).forEach(k => {
    if (params[k] !== undefined && params[k] !== null && params[k] !== '' && params[k] !== 'all') {
      cleanParams[k] = params[k];
    }
  });
  const query = new URLSearchParams(cleanParams).toString();
  return apiRequest(`/api/exams${query ? '?' + query : ''}`);
}

export function getGovtExamById(id) {
  return apiRequest(`/api/exams/${id}`);
}

export function getOfficialPortalsDirectory() {
  return apiRequest('/api/exams/portals');
}

export function getDeadlinesSummary(days = 30) {
  return apiRequest(`/api/deadlines/summary?days=${days}`);
}

export function getUpcomingDeadlines(days = 30) {
  return apiRequest(`/api/deadlines/upcoming?days=${days}`);
}

export function saveUserReminder(payload) {
  return apiRequest('/api/reminders', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getUserReminders(deviceId) {
  return apiRequest(`/api/reminders?device_id=${encodeURIComponent(deviceId)}`);
}

export function deleteUserReminder(id, deviceId) {
  return apiRequest(`/api/reminders/${id}?device_id=${encodeURIComponent(deviceId)}`, {
    method: 'DELETE'
  });
}
