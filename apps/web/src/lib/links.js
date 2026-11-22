// Links people typed are shown as links only when they are http(s): a javascript: link must never be clickable.
export const safeHref = (url) => (/^https?:\/\//i.test(String(url ?? '')) ? url : undefined);
