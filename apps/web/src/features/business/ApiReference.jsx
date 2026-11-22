// Business dashboard: the API reference: base URL, the key header, each call, the sandbox IDs and the errors.
import {CONSENT_FIELDS, TEST_BHARAT_IDS} from '@pirento/shared';
import {DashSection} from '../../components/ui/DashSection';
import {AppFrame} from '../products/AppFrame';
import {CALLS, apiBase} from './apiSample';

const ERRORS = [
  ['401 NO_KEY', 'No key sent. Send Authorization: Bearer <key>.'],
  ['401 BAD_KEY', 'The key is wrong or was revoked.'],
  ['403 NOT_ALLOWED', 'Your account cannot use this kind of key now (live before live access, or paused).'],
  ['400 INVALID_ID', 'Not a valid Bharat ID: the check digit is wrong.'],
  ['404 NOT_FOUND', 'No issued Bharat ID with this number, or no such consent.'],
];

const Code = ({children}) => (
  <pre className="overflow-x-auto rounded-[10px] bg-stone p-4 text-xs leading-relaxed">
    <code>{children}</code>
  </pre>
);

export function ApiReference({frame}) {
  const base = apiBase();
  return (
    <AppFrame
      {...frame}
      title="API / reference."
      intro={`Base URL: ${base}. Every call sends your key: Authorization: Bearer bid_test_… or bid_live_….`}
    >
      {CALLS.map((c, i) => (
        <DashSection key={c.path} n={i + 1} id={`call-${i}`} label={`${c.method} ${c.path}`} title={c.title}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Code>{c.curl(base, 'bid_test_…')}</Code>
            <Code>{c.answer}</Code>
          </div>
        </DashSection>
      ))}
      <DashSection n={4} id="fields" label="Consent" title="Details you / can ask for.">
        <ul className="grid max-w-3xl gap-2 text-sm sm:grid-cols-2">
          {Object.entries(CONSENT_FIELDS).map(([k, v]) => (
            <li key={k}>
              <code>{k}</code> <span className="text-muted">· {v}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-3xl text-sm text-muted">
          A consent is pending until the holder decides in their Bharat ID dashboard, then approved or declined. If they
          revoke it later, the details stop. Details are read fresh on every call.
        </p>
      </DashSection>
      <DashSection n={5} id="sandbox" label="Sandbox" title="Test / Bharat IDs.">
        <ul className="max-w-3xl space-y-2 text-sm">
          <li>
            <code className="tabular-nums">{TEST_BHARAT_IDS.approves}</code>{' '}
            <span className="text-muted">· every consent is approved</span>
          </li>
          <li>
            <code className="tabular-nums">{TEST_BHARAT_IDS.declines}</code>{' '}
            <span className="text-muted">· every consent is declined</span>
          </li>
          <li>
            <code className="tabular-nums">{TEST_BHARAT_IDS.pending}</code>{' '}
            <span className="text-muted">· consents stay pending</span>
          </li>
        </ul>
        <p className="mt-6 max-w-3xl text-sm text-muted">
          With a test key, any other Bharat ID answers 404. Sandbox details are made up.
        </p>
      </DashSection>
      <DashSection n={6} id="errors" label="Errors" title="When a call / is refused.">
        <p className="mb-4 text-sm text-muted">Errors come as {'{"error": {"code": "…", "message": "…"}}'}.</p>
        <dl className="grid max-w-3xl gap-3 text-sm sm:grid-cols-[12rem_1fr]">
          {ERRORS.map(([code, text]) => (
            <div key={code} className="contents">
              <dt className="font-mono">{code}</dt>
              <dd className="text-muted">{text}</dd>
            </div>
          ))}
        </dl>
      </DashSection>
    </AppFrame>
  );
}
