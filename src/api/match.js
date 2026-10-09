import { apiRequest } from './client';

export function matchProfile(profile) {
  return apiRequest('/api/match', {
    method: 'POST',
    body: JSON.stringify(profile)
  });
}

export function matchFamily(familyData) {
  return apiRequest('/api/match/family', {
    method: 'POST',
    body: JSON.stringify(familyData)
  });
}

export function whatIfSimulation(profile, changes) {
  return apiRequest('/api/whatif', {
    method: 'POST',
    body: JSON.stringify({ profile, changes })
  });
}

export function uploadCertificateOCR(file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest('/api/ocr', {
    method: 'POST',
    body: formData
  });
}
