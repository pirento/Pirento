// /whatsapp: Pirento's WhatsApp number with a button and a QR to start a chat, what the bot can do (the shared menu),
// whether this account's mobile is linked, and whether notices come there.
import {useRef} from 'react';
import {Link} from 'react-router-dom';
import {MessageCircle, ShieldCheck} from 'lucide-react';
import {QRCodeSVG} from 'qrcode.react';
import {WA_MENU} from '@pirento/shared';
import {PageHero} from '../../components/PageHero';
import {Label} from '../../components/ui/Heading';
import {whatsappCopy as copy} from '../../data/site';
import {useSignedIn} from '../auth/useSignedIn';
import {useApi} from '../../lib/api/useApi';
import {usePageMeta} from '../../lib/page';
import {usePageMotion} from '../../lib/motion';

// Pirento's WhatsApp Business number (the same as WHATSAPP_NUMBER on the server).
const NUMBER = '919988556368';
const shown = `+91 ${NUMBER.slice(2, 7)} ${NUMBER.slice(7)}`;

export function WhatsApp() {
  const {redirect, user} = useSignedIn();
  const prefs = useApi(user ? '/auth/me/notice-prefs' : null);
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(user)]);
  usePageMeta({title: `${copy.title} — Pirento`});
  if (redirect) return redirect;
  if (!user) return <div className="min-h-dvh" />;
  const link = `https://wa.me/${NUMBER}?text=${encodeURIComponent(copy.firstMessage)}`;
  const p = prefs.data;
  return (
    <div ref={ref} className="space-y-10">
      <PageHero label="Pirento Ecosystem · WhatsApp" title={copy.title} intro={copy.intro} />
      <div className="grid gap-6 md:grid-cols-12">
        <div className="rounded-[22px] border border-rule p-6 md:col-span-7 md:p-8" data-reveal>
          <p className="text-sm text-muted">WhatsApp</p>
          <p className="mt-1 font-display text-3xl tabular-nums">{shown}</p>
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-paper"
          >
            <MessageCircle aria-hidden className="size-4" /> {copy.open}
          </a>
          {p && (
            <div className="mt-8 space-y-3 border-t border-rule pt-6 text-sm">
              <p>{p.phone ? copy.linked(p.phone) : copy.notLinked}</p>
              <p>
                <span className="font-medium">{copy.notices}: </span>
                {p.whatsapp ? copy.noticesOn : copy.noticesOff}{' '}
                <Link to="/notifications" className="underline underline-offset-4">
                  Notifications
                </Link>
              </p>
            </div>
          )}
        </div>
        <div
          className="flex flex-col items-center justify-center rounded-[22px] border border-rule bg-stone p-6 md:col-span-5"
          data-reveal
        >
          <div className="rounded-[14px] bg-paper p-3">
            <QRCodeSVG value={link} size={168} level="M" fgColor="currentColor" bgColor="transparent" />
          </div>
          <p className="mt-3 text-sm text-muted">{copy.scan}</p>
        </div>
      </div>
      <div className="rounded-[22px] border border-rule p-6 md:p-8" data-reveal>
        <Label n={1}>{copy.can}</Label>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2">
          {WA_MENU.map((m) => (
            <li key={m.key} className="flex items-center gap-3 rounded-[14px] border border-rule px-4 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm text-paper tabular-nums">
                {m.key}
              </span>
              {m.label}
            </li>
          ))}
        </ol>
        <p className="mt-6 flex gap-3 text-sm text-muted">
          <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0" /> {copy.privacy}
        </p>
      </div>
    </div>
  );
}
