// Warning signs on a Bharat ID application, for the reviewer: the same PAN, mobile, or Aadhaar ending with the same
// date of birth on another person's application. Plain rules, not AI: the details never leave Pirento, and the
// reviewer always decides.

/** The flags for `doc`, given other applications that share one of its keys. */
export function flagsFor(doc, others) {
  const s = doc.sections ?? {};
  const flags = [];
  const pan = s.documents?.pan;
  const mobile = s.contact?.mobile;
  const aadhaar = s.documents?.aadhaar; // stored masked: XXXX XXXX 1234
  const dob = s.personal?.dob;
  for (const o of others) {
    if (o.userId === doc.userId) continue;
    const os = o.sections ?? {};
    const who = `application ${o.bharatId ?? String(o._id).slice(-6)} (${o.status})`;
    if (pan && os.documents?.pan === pan) flags.push({flag: 'Same PAN', detail: `PAN also on ${who}`});
    if (mobile && os.contact?.mobile === mobile) flags.push({flag: 'Same mobile', detail: `Mobile also on ${who}`});
    if (aadhaar && dob && os.documents?.aadhaar === aadhaar && os.personal?.dob === dob) {
      flags.push({flag: 'Same Aadhaar ending and birth date', detail: `Matches ${who}`});
    }
  }
  return flags;
}

/** The Mongo filter for applications that could match `doc`. */
export function lookalikes(doc) {
  const s = doc.sections ?? {};
  const or = [];
  if (s.documents?.pan) or.push({'sections.documents.pan': s.documents.pan});
  if (s.contact?.mobile) or.push({'sections.contact.mobile': s.contact.mobile});
  if (s.documents?.aadhaar) or.push({'sections.documents.aadhaar': s.documents.aadhaar});
  return or.length ? {_id: {$ne: doc._id}, $or: or} : null;
}
