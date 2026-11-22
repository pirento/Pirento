// Business dashboard: the API reference: base URL, the key header, each call, the sandbox IDs and the errors.
import {AUTH_METHODS, CONSENT_FIELDS, SANDBOX_AUTH, TEST_BHARAT_IDS} from '@pirento/shared';
import {Tag} from '../../components/ui/Tag';
import {DashSection} from '../../components/ui/DashSection';
import {AppFrame} from '../products/AppFrame';
import {CALLS, apiBase} from './apiSample';

const ERRORS = [
  ['401 NO_KEY', 'No key sent. Send Authorization: Bearer <key>.'],
  ['401 BAD_KEY', 'The key is wrong or was revoked.'],
  ['403 NOT_ALLOWED', 'Your account cannot use this kind of key now (live before live access, or paused).'],
  ['400 INVALID_ID', 'Not a valid Bharat ID: the check digit is wrong.'],
  ['404 NOT_FOUND', 'No issued Bharat ID with this number, or no such consent or check.'],
  ['403 FIELD_NOT_ALLOWED', 'You asked for a detail our team has not opened for your account.'],
  ['403 METHOD_NOT_ALLOWED', 'A check method our team has not opened for your account.'],
  ['501 METHOD_NOT_AVAILABLE', 'A method that is not built yet (app QR, fingerprint, iris).'],
  ['503 METHOD_OFF', 'Aadhaar OTP or face is not switched on yet.'],
  ['400 BAD_RETURN_URL', 'returnUrl must be https, on your registered website.'],
  ['402 INSUFFICIENT_CREDIT', 'Not enough credit for a live call. Add money in Billing.'],
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
      <DashSection n={CALLS.length + 1} id="methods" label="Checks" title="Ways to check / a holder.">
        <ul className="max-w-3xl divide-y divide-rule rounded-[18px] border border-rule">
          {AUTH_METHODS.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <span>
                <code>{m.id}</code> <span className="text-muted">· {m.label}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-muted">Level {m.level}</span>
                {m.expected && <Tag>Expected</Tag>}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-3xl text-sm text-muted">
          The person always does the check on Pirento’s page, so you never see a PIN or a code. Use a higher level for
          sensitive work (bank and NBFC KYC). Our team decides which methods your account may use.
        </p>
      </DashSection>
      <DashSection n={CALLS.length + 2} id="fields" label="Consent" title="Details you / can ask for.">
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
      <DashSection n={CALLS.length + 3} id="sandbox" label="Sandbox" title="Test / Bharat IDs.">
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
          With a test key, any other Bharat ID answers 404. Sandbox details are made up. On the check page the sandbox
          takes PIN {SANDBOX_AUTH.pin} with date of birth {SANDBOX_AUTH.dob}, and code {SANDBOX_AUTH.code} for both
          codes.
        </p>
      </DashSection>
      <DashSection n={CALLS.length + 4} id="errors" label="Errors" title="When a call / is refused.">
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
