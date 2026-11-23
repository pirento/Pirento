// Renders a lesson's formatted text (lessonText.js) as React elements: headings, lists, code, images, links.
import {Fragment} from 'react';
import {blocks, inline} from './lessonText';

function Inline({text}) {
  return inline(text).map((x, i) =>
    x.t === 'b' ? (
      <strong key={i}>{x.v}</strong>
    ) : x.t === 'code' ? (
      <code key={i} className="rounded bg-stone px-1 py-0.5 text-[0.9em]">
        {x.v}
      </code>
    ) : x.t === 'a' ? (
      <a
        key={i}
        href={x.href}
        target="_blank"
        rel="noreferrer noopener"
        className="text-ink underline underline-offset-4"
      >
        {x.v}
      </a>
    ) : (
      <Fragment key={i}>{x.v}</Fragment>
    ),
  );
}

export function LessonText({text}) {
  return (
    <div className="body space-y-4">
      {blocks(text).map((b, i) =>
        b.type === 'h' ? (
          b.level === 1 ? (
            <h3 key={i} className="pt-2 text-2xl text-ink">
              <Inline text={b.text} />
            </h3>
          ) : (
            <h4 key={i} className="pt-2 text-xl text-ink">
              <Inline text={b.text} />
            </h4>
          )
        ) : b.type === 'ul' || b.type === 'ol' ? (
          (() => {
            const List = b.type;
            return (
              <List key={i} className={`space-y-1 pl-5 ${b.type === 'ul' ? 'list-disc' : 'list-decimal'}`}>
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} />
                  </li>
                ))}
              </List>
            );
          })()
        ) : b.type === 'code' ? (
          <pre key={i} className="overflow-x-auto rounded-[12px] border border-rule bg-stone p-4 text-sm text-ink">
            {b.text}
          </pre>
        ) : b.type === 'img' ? (
          <img
            key={i}
            src={b.src}
            alt={b.alt}
            loading="lazy"
            className="max-w-full rounded-[14px] border border-rule"
          />
        ) : (
          <p key={i}>
            <Inline text={b.text} />
          </p>
        ),
      )}
    </div>
  );
}
