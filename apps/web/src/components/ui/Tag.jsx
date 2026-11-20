// Small pill labels, including the Now / Expected product status.
export const Tag = ({children, tone = 'rule'}) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
      tone === 'accent' ? 'border-accent bg-accent text-on-accent' : 'border-rule text-muted'
    }`}
  >
    {children}
  </span>
);

export const StatusTag = ({status}) => (status === 'now' ? <Tag tone="accent">Now</Tag> : <Tag>Expected</Tag>);

/** "Line one / Line two" → masked lines; `hl` gets the highlighter. */
