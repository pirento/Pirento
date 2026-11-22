// Business dashboard: the company's details, editable while on test access, read-only once with the team or live.
import {useState} from 'react';
import {BUSINESS_PROFILE, validateFields} from '@pirento/shared';
import {api} from '../../lib/api/client';
import {AppFrame} from '../products/AppFrame';
import {StepForm} from '../identity/StepForm';

export function CompanyDetails({frame, data, reload}) {
  const {business} = data;
  const [note, setNote] = useState('');
  const editable = business.status === 'test';
  return (
    <AppFrame {...frame} title="Company / details." intro={BUSINESS_PROFILE.intro}>
      {editable ? (
        <div className="max-w-3xl">
          <StepForm
            section={{...BUSINESS_PROFILE, intro: null}}
            initial={business.profile}
            validate={(values) => validateFields(BUSINESS_PROFILE.fields, values)}
            save={(values) => api('/identity/business/me/profile', {method: 'PUT', body: values})}
            onSaved={() => {
              setNote('Saved.');
              reload();
            }}
            submitLabel="Save details"
          />
          {note && (
            <p role="status" className="mt-4 text-sm">
              {note}
            </p>
          )}
        </div>
      ) : (
        <dl className="grid max-w-3xl gap-x-8 gap-y-4 rounded-[18px] border border-rule p-6 text-sm sm:grid-cols-2">
          {BUSINESS_PROFILE.fields
            .filter((f) => business.profile?.[f.id])
            .map((f) => (
              <div key={f.id}>
                <dt className="text-muted">{f.label}</dt>
                <dd className="break-words">{business.profile[f.id]}</dd>
              </div>
            ))}
        </dl>
      )}
    </AppFrame>
  );
}
