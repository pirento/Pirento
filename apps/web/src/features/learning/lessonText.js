// A lesson's text with a little formatting staff can type: "# " headings, "- " and "1. " lists, ``` code blocks,
// ![alt](https://…) images, and inline **bold**, `code` and [links](https://…). Parsed into plain blocks the page
// renders as React elements, so nothing typed can become HTML. Only http(s) links and images are kept.
const HTTP = /^https?:\/\/\S+$/i;

/** Inline text → [{t: 'text'|'b'|'code'|'a', v, href?}]. */
export function inline(text) {
  const out = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (let m; (m = re.exec(text));) {
    if (m.index > last) out.push({t: 'text', v: text.slice(last, m.index)});
    if (m[1] != null) out.push({t: 'b', v: m[1]});
    else if (m[2] != null) out.push({t: 'code', v: m[2]});
    else out.push(HTTP.test(m[4]) ? {t: 'a', v: m[3], href: m[4]} : {t: 'text', v: m[3]});
    last = re.lastIndex;
  }
  if (last < text.length) out.push({t: 'text', v: text.slice(last)});
  return out;
}

/** The whole text → blocks: h (level 1-3), p, ul, ol, code, img. */
export function blocks(text) {
  const lines = String(text ?? '')
    .replace(/\r/g, '')
    .split('\n');
  const out = [];
  let para = [];
  const flush = () => {
    if (para.length) out.push({type: 'p', text: para.join(' ')});
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    if (t.startsWith('```')) {
      flush();
      const code = [];
      for (i++; i < lines.length && !lines[i].trim().startsWith('```'); i++) code.push(lines[i]);
      out.push({type: 'code', text: code.join('\n')});
      continue;
    }
    const h = /^(#{1,3})\s+(.+)$/.exec(t);
    const img = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(t);
    const ul = /^[-*]\s+(.+)$/.exec(t);
    const ol = /^\d+[.)]\s+(.+)$/.exec(t);
    if (!t) flush();
    else if (h) {
      flush();
      out.push({type: 'h', level: h[1].length, text: h[2]});
    } else if (img) {
      flush();
      if (HTTP.test(img[2])) out.push({type: 'img', alt: img[1], src: img[2]});
    } else if (ul || ol) {
      flush();
      const type = ul ? 'ul' : 'ol';
      const prev = out.at(-1);
      if (prev?.type === type) prev.items.push((ul ?? ol)[1]);
      else out.push({type, items: [(ul ?? ol)[1]]});
    } else para.push(t);
  }
  flush();
  return out;
}
