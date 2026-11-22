// Where a Bharat ID application's Digio verification stands, read the same way by the browser and the identity service.

// KYC statuses that mean the person finished their part (Digio may still be reviewing, or has approved).
export const KYC_DONE = ['completed', 'success', 'approval_pending', 'review_ready', 'approved'];
// KYC statuses that end a request without a pass: a new one may be started.
export const KYC_FAILED = ['rejected', 'expired', 'terminated'];

export const kycDone = (doc) => KYC_DONE.includes(doc?.digio?.kycStatus);
export const kycFailed = (doc) => KYC_FAILED.includes(doc?.digio?.kycStatus);
export const declarationSigned = (doc) => doc?.digio?.docStatus === 'signed';
