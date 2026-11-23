// Load test with k6 (https://k6.io): a crowd browsing the public pages and the API reads every page makes.
// Run against a test stack, never production: `k6 run -e BASE=https://staging.example.com scripts/load/k6.js`.
// Raise TARGET step by step (1k, 10k, 50k …) and watch p95 latency, errors and the autoscaling in CloudWatch.
/* global __ENV */
import http from 'k6/http';
import {check, sleep} from 'k6';

const BASE = __ENV.BASE || 'http://127.0.0.1:4000';
const TARGET = Number(__ENV.TARGET || 200);

export const options = {
  stages: [
    {duration: '2m', target: TARGET}, // ramp up, so autoscaling can follow
    {duration: '5m', target: TARGET},
    {duration: '1m', target: 0},
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // under 1% errors
    http_req_duration: ['p(95)<800'], // 95% under 0.8 s
  },
};

const READS = [
  '/api/catalog/settings',
  '/api/catalog/prices',
  '/api/learning/tracks',
  '/api/learning/programs',
  '/api/learning/openings',
];

export default function () {
  const page = http.get(`${BASE}/`);
  check(page, {'home 200': (r) => r.status === 200});
  for (const path of READS) {
    const r = http.get(BASE + path);
    check(r, {[`${path} 200`]: (x) => x.status === 200});
  }
  sleep(1 + Math.random() * 3); // people read before they click
}
