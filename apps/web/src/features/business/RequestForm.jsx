// The public request for Bharat ID for Business: the shared field list, the terms, and a hidden field bots fill.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {BUSINESS_REQUEST, validateFields} from '@pirento/shared';
import {bharatIdBusiness as copy} from '../../data/site';
import {api} from '../../lib/api/client';
import {StepForm} from '../identity/StepForm';

export function RequestForm() {
  const [terms, setTerms] = useState(false);
  const [trap, setTrap] = useState('');
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <p role="status" className="body max-w-2xl rounded-[22px] border border-accent p-6">
        {copy.form.sent}
      </p>
    );
  }
  return (
    <div className="max-w-3xl">
      <StepForm
        section={BUSINESS_REQUEST}
        validate={(values) =>
          terms ? validateFields(BUSINESS_REQUEST.fields, values) : {error: 'Tick the box to accept the terms'}
        }
        save={(values) =>
          api('/identity/business/requests', {
            method: 'POST',
            body: {...values, acceptTerms: terms, website_confirm: trap},
          })
        }
        onSaved={() => setSent(true)}
        submitLabel={copy.form.send}
      >
        {/* Hidden from people; bots fill it in. */}
        <input
          type="text"
          name="website_confirm"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
          className="absolute -left-[9999px] size-px opacity-0"
        />
        <label className="flex items-start gap-3 rounded-[18px] border border-rule p-5">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-1 size-4 shrink-0"
          />
          <span className="text-[0.95rem] leading-relaxed text-muted">
            {copy.form.terms}{' '}
            <Link to="/terms" className="text-ink underline underline-offset-4">
              Read the terms
            </Link>
          </span>
        </label>
      </StepForm>
    </div>
  );
}
