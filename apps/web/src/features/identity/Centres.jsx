// Admin → Enrolment centres: make a centre, see what its QR started, and download its QR or a printable poster.
import {useRef, useState} from 'react';
import {QRCodeSVG} from 'qrcode.react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {bharatIdStart as copy} from '../../data/site';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {useSession} from '../../lib/api/session';

const CAN_EDIT = ['staff', 'superadmin']; // ACCESS.identity: reviewers make and close centres

export const startUrl = (code) => `${window.location.origin}/bharat-id/start?centre=${code}`;

/** Draws the QR's SVG onto a canvas, optionally inside a poster with the centre's name, and saves it as a PNG. */
async function savePng(svg, centre, poster) {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
  await img.decode();
  const [w, h, qr] = poster ? [1240, 1754, 900] : [1000, 1000, 1000];
  const canvas = Object.assign(document.createElement('canvas'), {width: w, height: h});
  const g = canvas.getContext('2d');
  g.fillStyle = 'white'; // printed on paper and scanned by phones: black on white, whatever the screen's theme
  g.fillRect(0, 0, w, h);
  if (poster) {
    g.fillStyle = 'black';
    g.textAlign = 'center';
    g.font = '600 72px sans-serif';
    g.fillText(copy.poster.title, w / 2, 200);
    g.font = '40px sans-serif';
    g.fillText(`${centre.name}, ${centre.city}`, w / 2, 280);
    g.drawImage(img, (w - qr) / 2, 360, qr, qr);
    g.font = '36px sans-serif';
    copy.poster.lines.forEach((line, i) => g.fillText(line, w / 2, 1340 + i * 56));
    g.font = '28px monospace';
    g.fillText(startUrl(centre.code), w / 2, 1340 + copy.poster.lines.length * 56 + 40);
  } else {
    g.drawImage(img, 0, 0, qr, qr);
  }
  const a = Object.assign(document.createElement('a'), {
    href: canvas.toDataURL('image/png'),
    download: `bharat-id-${poster ? 'poster' : 'qr'}-${centre.code}.png`,
  });
  a.click();
}

function CentreCard({c, canEdit, onChange}) {
  const box = useRef(null);
  const [note, setNote] = useState('');
  const svg = () => box.current.querySelector('svg');
  const toggle = async () => {
    try {
      await api(`/identity/staff/centres/${c._id}`, {
        method: 'PATCH',
        body: {name: c.name, city: c.city, active: !c.active},
      });
      onChange();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  const started = Object.values(c.counts).reduce((a, b) => a + b, 0);
  return (
    <li className="grid gap-5 rounded-[18px] border border-rule p-5 sm:grid-cols-[auto_1fr]">
      {/* A QR scans only with a light quiet zone around it, so this box stays white in dark mode too. */}
      <div ref={box} className="w-fit rounded-[10px] bg-white p-3">
        <QRCodeSVG value={startUrl(c.code)} size={150} level="M" marginSize={0} title={`QR for ${c.name}`} />
      </div>
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto font-medium">
            {c.name}, {c.city}
          </p>
          <Tag tone={c.active ? 'accent' : 'rule'}>{c.active ? 'Open' : 'Closed'}</Tag>
        </div>
        <p className="break-all font-mono text-xs text-muted">{startUrl(c.code)}</p>
        <p className="text-sm text-muted">
          Started {started} · submitted {c.counts.submitted ?? 0} · issued {c.counts.approved ?? 0}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" icon={null} onClick={() => savePng(svg(), c, true)}>
            Download poster
          </Button>
          <Button variant="outline" icon={null} onClick={() => savePng(svg(), c, false)}>
            Download QR
          </Button>
          {canEdit && (
            <Button variant="outline" icon={null} onClick={toggle}>
              {c.active ? 'Close centre' : 'Open again'}
            </Button>
          )}
        </div>
        {note && <p className="text-sm">{note}</p>}
      </div>
    </li>
  );
}

export function Centres() {
  const list = useApi('/identity/staff/centres');
  const {user} = useSession();
  const canEdit = CAN_EDIT.includes(user?.role);
  const [form, setForm] = useState({name: '', city: ''});
  const [note, setNote] = useState('');
  const add = async (e) => {
    e.preventDefault();
    setNote('');
    try {
      await api('/identity/staff/centres', {method: 'POST', body: form});
      setForm({name: '', city: ''});
      list.reload();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <div className="mt-8 space-y-8">
      {canEdit && (
        <form onSubmit={add} className="flex max-w-3xl flex-wrap items-end gap-3 rounded-[18px] border border-rule p-5">
          <div className="min-w-48 grow">
            <Field
              label="Centre name"
              value={form.name}
              onChange={(e) => setForm((f) => ({...f, name: e.target.value}))}
            />
          </div>
          <div className="min-w-40 grow">
            <Field label="City" value={form.city} onChange={(e) => setForm((f) => ({...f, city: e.target.value}))} />
          </div>
          <Button type="submit" variant="accent">
            Add centre
          </Button>
          {note && <p className="w-full text-sm">{note}</p>}
        </form>
      )}
      {list.error && <p className="body">⚠ {list.error.message}</p>}
      {list.data?.length === 0 && <p className="body text-muted">No centres yet.</p>}
      <ul className="grid gap-4 xl:grid-cols-2">
        {list.data?.map((c) => (
          <CentreCard key={c._id} c={c} canEdit={canEdit} onChange={list.reload} />
        ))}
      </ul>
    </div>
  );
}
