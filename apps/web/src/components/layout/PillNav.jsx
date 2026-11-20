// Desktop page links with a sliding pill under the active one.
import {useLayoutEffect, useRef, useState} from 'react';
import {NavLink, useLocation} from 'react-router-dom';

export function PillNav({items}) {
  const {pathname, hash} = useLocation();
  const listRef = useRef(null);
  const [pill, setPill] = useState(null);
  // The first link is the site's home: active only on that exact page, not on its sub-pages.
  const active = (to) =>
    to.includes('#')
      ? `${pathname}${hash}` === to
      : to === items[0].to
        ? pathname === to && !hash
        : pathname.startsWith(to);

  useLayoutEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    setPill(el ? {left: el.offsetLeft, width: el.offsetWidth} : null);
  }, [pathname, hash, items]);

  return (
    <ul ref={listRef} className="relative hidden items-center rounded-full border border-rule p-1 lg:flex">
      {pill && (
        <span
          aria-hidden
          className="absolute top-1 bottom-1 rounded-full bg-ink transition-all duration-500 ease-ui"
          style={pill}
        />
      )}
      {items.map((item) => (
        <li key={item.to} data-active={active(item.to)}>
          <NavLink
            to={item.to}
            className={`relative block rounded-full px-4 py-1.5 text-sm transition-colors duration-500 ${
              active(item.to) ? 'text-paper' : 'text-muted hover:text-ink'
            }`}
          >
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
