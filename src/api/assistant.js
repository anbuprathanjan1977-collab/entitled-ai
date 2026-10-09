import { apiRequest } from './client';

export function chatWithAssistant(message, language = 'en', schemeId = null) {
  return apiRequest('/api/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      language,
      scheme_id: schemeId
    })
  });
}
