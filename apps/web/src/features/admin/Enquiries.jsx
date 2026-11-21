// Enquiries: messages from the contact form on every site. Reply by email or phone, then mark it handled.
import {useState} from 'react';
import {Mail, Phone} from 'lucide-react';
import {getProduct} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {api} from '../../lib/api/client';
import {formatDate} from '../../lib/format';
import {useService} from '../../lib/prices';
import {StaffQueue} from './StaffQueue';

const FILTERS = [
  {label: 'New', value: 'new'},
  {label: 'Handled', value: 'handled'},
];

function EnquiryRow({e, onChange}) {
  const [note, setNote] = useState(e.note ?? '');
  const [error, setError] = useState('');
  const service = useService(e.service ?? '');
  const product = getProduct(e.product ?? '');
  const mark = async (status) => {
    setError('');
    try {
      await api(`/support/staff/enquiries/${e._id}`, {method: 'PATCH', body: {status, note}});
      onChange();
    } catch (err) {
      setError(err.message);
    }
  };
  const subject = `Re: your message to ${product?.name ?? 'Pirento'}${service ? ` about ${service.name}` : ''}`;
  return (
    <details className="border-b border-rule">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block font-medium">
            #{e.enquiryNo} · {e.name}
          </span>
          <span className="block text-sm text-muted">
            {e.email} · {product?.name ?? 'Pirento'}
            {service && ` · ${service.name}`} · {formatDate(e.createdAt)}
          </span>
        </span>
        <Tag tone={e.status === 'new' ? 'accent' : 'rule'}>{e.status === 'new' ? 'New' : 'Handled'}</Tag>
      </summary>
      <div className="grid gap-8 pb-8 md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-sm whitespace-pre-line break-words">{e.message}</p>
          <div className="flex flex-wrap gap-2 text-sm">
            <a
              href={`mailto:${e.email}?subject=${encodeURIComponent(subject)}`}
              className="inline-flex items-center gap-2 rounded-full border border-rule px-4 py-2 hover:border-ink"
            >
              <Mail aria-hidden className="size-4" /> Reply by email
            </a>
            {e.phone && (
              <a
                href={`tel:${e.phone}`}
                className="inline-flex items-center gap-2 rounded-full border border-rule px-4 py-2 hover:border-ink"
              >
                <Phone aria-hidden className="size-4" /> {e.phone}
              </a>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <Field
            label="Team note: what was done (only staff see it)"
            maxLength={1000}
            value={note}
            onChange={(ev) => setNote(ev.target.value)}
            error={error}
          />
          {e.handledBy && <p className="text-sm text-muted">Last changed by {e.handledBy}</p>}
          <Button
            variant={e.status === 'new' ? 'primary' : 'outline'}
            icon={null}
            onClick={() => mark(e.status === 'new' ? 'handled' : 'new')}
          >
            {e.status === 'new' ? 'Mark handled' : 'Open again'}
          </Button>
        </div>
      </div>
    </details>
  );
}

export function Enquiries() {
  return (
    <StaffQueue
      path="/support/staff/enquiries"
      filters={FILTERS}
      byProduct={{}}
      search="Enquiry number, name, email or words"
      render={(e, reload) => <EnquiryRow key={e._id} e={e} onChange={reload} />}
    />
  );
}
