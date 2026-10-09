export function downloadICS(title, description, dateStr, officialUrl = '') {
  try {
    // dateStr format: YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length < 3) return;
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    const icsDate = `${year}${month}${day}`;
    const nextDay = `${year}${month}${String(Number(day) + 1).padStart(2, '0')}`;

    const cleanTitle = title.replace(/,/g, '\\,');
    const cleanDesc = `${description} \n\nOfficial Portal: ${officialUrl}`.replace(/,/g, '\\,').replace(/\n/g, '\\n');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UrimaiAI//Government Scheme and Exam Deadline Tracker//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:urimai-${Date.now()}@urimai.gov.in`,
      `DTSTAMP:${icsDate}T090000Z`,
      `DTSTART;VALUE=DATE:${icsDate}`,
      `DTEND;VALUE=DATE:${nextDay}`,
      `SUMMARY:⚠️ DEADLINE: ${cleanTitle}`,
      `DESCRIPTION:${cleanDesc}`,
      `URL:${officialUrl}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${cleanTitle} closes tomorrow!`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${cleanTitle.substring(0, 25).replace(/\s+/g, '_')}_deadline.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Failed to generate calendar file', err);
  }
}

export function getGoogleCalendarUrl(title, description, dateStr, officialUrl = '') {
  try {
    const parts = dateStr.split('-');
    if (parts.length < 3) return '#';
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    const icsDate = `${year}${month}${day}`;
    const nextDay = `${year}${month}${String(Number(day) + 1).padStart(2, '0')}`;

    const text = encodeURIComponent(`⚠️ Application Deadline: ${title}`);
    const details = encodeURIComponent(`${description}\n\nOfficial Portal: ${officialUrl}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${icsDate}/${nextDay}&details=${details}`;
  } catch {
    return '#';
  }
}

export function getWhatsAppReminderUrl(title, dateStr, daysLeft, officialUrl = '') {
  try {
    const urgencyText = daysLeft <= 0 ? 'Closes Today!' : `${daysLeft} days left`;
    const message = `🚨 *UrimaiAI Deadline Alert: Government Scheme / Exam Closing Soon!*\n\n📌 *${title}*\n⏱ *Last Date to Apply:* ${dateStr} (${urgencyText})\n\n🔗 *Official Application Portal:* ${officialUrl || 'https://urimai.ai'}\n\n⚠️ *Don't miss out! Submit your application before the portal closes.*`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  } catch {
    return '#';
  }
}

export function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // AudioContext blocked by browser policy
  }
}
