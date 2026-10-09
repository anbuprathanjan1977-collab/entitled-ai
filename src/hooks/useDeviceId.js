import { useState, useEffect } from 'react';

const DEVICE_STORAGE_KEY = 'urimai_device_id';

function generateRandomUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'device-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
}

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    let id = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!id) {
      id = generateRandomUUID();
      localStorage.setItem(DEVICE_STORAGE_KEY, id);
    }
    setDeviceId(id);
  }, []);

  return deviceId;
}
