// The Bharat ID declaration the applicant eSigns on Digio: their details and the consent text, as a one-page PDF.
const W = 595; // A4 in points
const H = 842;

// Built-in Helvetica covers Latin-1 only. Names are entered in English letters (form.js), so this is a safety net for
// older applications: any other letter prints as "?".
const latin1 = (s) => String(s ?? '').replace(/[^\x20-\x7e\xa0-\xff]/g, '?');
const esc = (s) => latin1(s).replace(/[\\()]/g, (c) => `\\${c}`);

/** Splits text into lines of at most `width` characters, at spaces. */
export function wrap(text, width = 88) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    if (line && line.length + word.length + 1 > width) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

export const DECLARATION =
  'I confirm these details are mine and correct, and I agree that Pirento stores them to issue and verify my ' +
  'Bharat ID. I understand Bharat ID is a Pirento identifier, not a government ID.';

/** The rows printed for an application, in form order. */
export function rowsOf(doc) {
  const s = doc.sections ?? {};
  return [
    ['Full name', s.personal?.fullName],
    ["Father's name", s.personal?.fatherName],
    ['Date of birth', s.personal?.dob],
    ['Gender', s.personal?.gender],
    ['PAN', s.documents?.pan],
    ['Aadhaar', s.documents?.aadhaar],
    ['Address', [s.address?.line, s.address?.city, s.address?.state, s.address?.pincode].filter(Boolean).join(', ')],
    ['Email', doc.email],
    ['Mobile', s.contact?.mobile],
    ['Nominee', s.nominee?.nomineeName && `${s.nominee.nomineeName} (${s.nominee.nomineeRelation})`],
  ].filter(([, v]) => v);
}

/** A one-page PDF, built by hand: a few text lines need no PDF library. */
export function declarationPdf(doc, now = new Date()) {
  const ops = [];
  let y = H - 72;
  const text = (str, size = 11, font = 'F1') => {
    ops.push(`BT /${font} ${size} Tf 56 ${y} Td (${esc(str)}) Tj ET`);
    y -= size + 7;
  };
  text('Bharat ID - Declaration', 20, 'F2');
  y -= 8;
  text(`Application ${doc._id} - prepared ${now.toISOString().slice(0, 10)}`, 9);
  y -= 14;
  for (const [label, value] of rowsOf(doc)) {
    for (const [i, line] of wrap(`${label}: ${value}`, 84).entries()) text(i ? `    ${line}` : line);
  }
  y -= 14;
  text('Declaration', 13, 'F2');
  for (const line of wrap(DECLARATION)) text(line);
  y -= 10;
  for (const line of wrap('Signed electronically with Aadhaar eSign through Digio.', 88)) text(line, 9);

  const stream = ops.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
  ];
  let out = '%PDF-1.4\n';
  const offsets = objects.map((body, i) => {
    const at = Buffer.byteLength(out, 'latin1');
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return at;
  });
  const xref = Buffer.byteLength(out, 'latin1');
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}
