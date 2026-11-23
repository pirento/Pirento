// Filing due dates as an .ics calendar file the person saves; their calendar does the reminding.
/**
 * Due dates as a calendar file, each with a reminder three days before, so the phone or Google Calendar reminds
 * the person (Pirento never stores them).
 */
export function icsFile(dates) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const esc = (t) =>
    String(t)
      .replace(/[\\;,]/g, (c) => `\\${c}`)
      .replace(/\n/g, ' ');
  const events = dates
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.due))
    .map((d, i) =>
      [
        'BEGIN:VEVENT',
        `UID:pirento-${d.due}-${i}@pirento.com`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${d.due.replaceAll('-', '')}`,
        `SUMMARY:${esc(d.what)}`,
        `DESCRIPTION:${esc(`${d.note} Check the official portal: dates can be extended.`)}`,
        'BEGIN:VALARM',
        'TRIGGER:-P3D',
        'ACTION:DISPLAY',
        `DESCRIPTION:${esc(d.what)}`,
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n'),
    );
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pirento//Filing dates//EN', ...events, 'END:VCALENDAR'].join(
    '\r\n',
  );
}
