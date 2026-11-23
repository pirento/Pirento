// Public check of any Pirento code.
import {useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {Search} from 'lucide-react';
import {PageHero} from '../../components/PageHero';
import {Button} from '../../components/ui/Button';
import {Section} from '../../components/ui/Heading';
import {VerifiedCard, verifyPath} from './VerifiedCard';
import {useApi} from '../../lib/api/useApi';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';

export function Verify() {
  const {code: raw} = useParams();
  const code = raw?.toUpperCase();
  const navigate = useNavigate();
  const [input, setInput] = useState(code ?? '');
  const result = useApi(code ? verifyPath(code) : null);
  const ref = useRef(null);
  usePageMotion(ref, [code]);
  usePageMeta({
    title: 'Verify a Pirento code',
    description: 'Check a Bharat ID, a certificate, an order number or a completion code.',
  });

  return (
    <div ref={ref}>
      <PageHero
        label="Verify"
        title="Check a / Pirento code."
        hl="Pirento code."
        intro="Enter a Bharat ID, a Pirento Green certificate (PG-…, PF-…) or its order number, an Intern certificate code (PC-…) or a completion code (LGL-, BLK-, GRN-…) to see if it is genuine."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = input.replace(/\s+/g, '').toUpperCase();
            if (v) navigate(`/verify/${v}`);
          }}
          className="mt-10 flex max-w-xl items-center gap-3 rounded-full border border-rule bg-paper py-2 pr-2 pl-5 focus-within:border-ink"
          data-hero-fade
        >
          <Search aria-hidden className="size-4 text-muted" />
          <label htmlFor="code" className="sr-only">
            Code
          </label>
          <input
            id="code"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Bharat ID, PG-100021 or order number"
            className="w-full bg-transparent uppercase outline-none placeholder:text-muted placeholder:normal-case"
          />
          <Button type="submit" className="px-5! py-2.5!">
            Check
          </Button>
        </form>
      </PageHero>
      {code && (
        <Section className="pt-0! md:pt-0!">
          <div aria-live="polite">
            {result.loading && <p className="body">Checking…</p>}
            {result.error && (
              <p className="body">
                <strong>Not found.</strong> {result.error.message}. Check for typos.
              </p>
            )}
            {result.data && <VerifiedCard code={code} data={result.data} />}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Staff ────────────────────────────────────────────────────────────────
