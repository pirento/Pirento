// Intern certificates: their public codes and what anyone may see of them.
import crypto from 'node:crypto';
import {TRACKS} from '@pirento/shared/exam';

export const trackName = (slug) => TRACKS.find((t) => t.slug === slug)?.name ?? slug;

export const newCertificateCode = () => `PC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

/** What anyone may see about a certificate: never the account it belongs to. */
export const publicCertificate = (c) => ({
  code: c.code,
  kind: c.kind ?? 'exam',
  fullName: c.fullName,
  track: c.track,
  trackName: c.title ?? trackName(c.track), // the track (or internship role) as named when it was issued
  company: c.company,
  weeks: c.weeks,
  percent: c.percent,
  skills: c.skills,
  issuedAt: c.issuedAt,
});

/** Fisher–Yates with a crypto source, so the question order cannot be predicted. */
export function shuffled(items) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
