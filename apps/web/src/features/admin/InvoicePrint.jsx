// /admin/invoices/print?ids=a,b: invoices to print in one go, each on its own sheet, on A4 or a 4 × 6 inch thermal
// sheet (the same format choice as shipping labels).
import {Link, Navigate, useSearchParams} from 'react-router-dom';
import {ArrowLeft, Printer} from 'lucide-react';
import {shippingCopy as copy} from '../../data/site';
import {useSignedIn} from '../auth/useSignedIn';
import {useApi} from '../../lib/api/useApi';
import {usePageMeta} from '../../lib/page';
import {InvoiceDoc} from '../orders/InvoiceDoc';
import {FormatPicker, PrintArea, Sheet, useFormat, usePrintPaper} from '../orders/print';
import {isStaffRole} from './adminNav';

export function InvoicePrint() {
  const [params] = useSearchParams();
  const ids = (params.get('ids') ?? '').split(',').filter(Boolean);
  const {redirect, user} = useSignedIn({loginPath: '/admin/login', area: 'any'});
  const staff = user && isStaffRole(user.role);
  const {data: items, error} = useApi(staff && ids.length ? `/orders/staff/invoices/print?ids=${ids.join(',')}` : null);
  const [format, setFormat] = useFormat();
  usePageMeta({title: 'Invoices — Pirento Admin'});
  usePrintPaper(format);

  if (redirect) return redirect;
  if (user && !staff) return <Navigate to="/dashboard" replace />;
  if (error) return <p className="text-sm">⚠ {error.message}</p>;
  if (!items) return <div className="min-h-dvh" />;
  return (
    <div>
      <div className="no-print mb-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/admin/invoices" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
            <ArrowLeft aria-hidden className="size-4" /> Back to invoices
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm text-paper"
          >
            <Printer aria-hidden className="size-4" /> {copy.printPages(items.length)}
          </button>
        </div>
        <FormatPicker format={format} onChange={setFormat} />
        <p className="text-xs text-muted">{format === 'thermal' ? copy.thermalTip : copy.a4Tip}</p>
      </div>
      <PrintArea>
        {items.map((i) => (
          <Sheet key={i._id} format={format}>
            <InvoiceDoc invoice={i} size={format} />
          </Sheet>
        ))}
      </PrintArea>
    </div>
  );
}
