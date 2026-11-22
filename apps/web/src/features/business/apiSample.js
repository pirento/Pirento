// The API calls shown on the Bharat ID for Business page and in the dashboard's reference, built for a given base URL.
import {TEST_BHARAT_IDS} from '@pirento/shared';

export const apiBase = () => `${window.location.origin}/api/identity/v1`;

export const CALLS = [
  {
    title: 'Verify a Bharat ID',
    method: 'GET',
    path: '/ids/{bharatId}',
    curl: (base, key) => `curl ${base}/ids/${TEST_BHARAT_IDS.approves} \\\n  -H "Authorization: Bearer ${key}"`,
    answer: `{"data": {"bharatId": "${TEST_BHARAT_IDS.approves}", "issued": true, "name": "Asha T.", "state": "Delhi", "mode": "test"}}`,
  },
  {
    title: 'Ask the holder to share details',
    method: 'POST',
    path: '/consents',
    curl: (base, key) =>
      `curl -X POST ${base}/consents \\\n  -H "Authorization: Bearer ${key}" -H "Content-Type: application/json" \\\n  -d '{"bharatId": "${TEST_BHARAT_IDS.approves}", "purpose": "Open a savings account", "fields": ["name", "dob", "pan"], "reference": "APP-1001"}'`,
    answer: '{"data": {"id": "…", "status": "pending", "fields": ["name", "dob", "pan"], "mode": "live"}}',
  },
  {
    title: 'Read a consent (and the details, once allowed)',
    method: 'GET',
    path: '/consents/{id}',
    curl: (base, key) => `curl ${base}/consents/{id} \\\n  -H "Authorization: Bearer ${key}"`,
    answer: '{"data": {"id": "…", "status": "approved", "details": {"name": "…", "dob": "…", "pan": "…"}}}',
  },
  {
    title: 'Check that a person holds the Bharat ID',
    method: 'POST',
    path: '/auth/sessions',
    curl: (base, key) =>
      `curl -X POST ${base}/auth/sessions \\\n  -H "Authorization: Bearer ${key}" -H "Content-Type: application/json" \\\n  -d '{"bharatId": "${TEST_BHARAT_IDS.approves}", "method": "pin_dob", "returnUrl": "https://your-site.example/back", "reference": "LOGIN-1"}'`,
    answer:
      '{"data": {"id": "…", "status": "pending", "method": "pin_dob", "level": 1, "url": "https://…/bharat-id/authorize/…?t=…"}}\n\nSend the person to "url". They come back to your returnUrl with ?session=<id>&status=passed.',
  },
  {
    title: 'Read the result of a check',
    method: 'GET',
    path: '/auth/sessions/{id}',
    curl: (base, key) => `curl ${base}/auth/sessions/{id} \\\n  -H "Authorization: Bearer ${key}"`,
    answer: '{"data": {"id": "…", "status": "passed", "method": "pin_dob", "level": 1, "passedAt": "…"}}',
  },
];
