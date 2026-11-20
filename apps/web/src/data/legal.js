// The Privacy Policy and the Refund and Cancellation Policy. Each line describes what the site and its services
// actually do; change the text here when the code changes. The Terms live in site.js (they carry TERMS_VERSION).

export const privacy = {
  updated: '20 November 2026',
  intro:
    'How Venturecore Solutions Private Limited, which runs the Pirento Ecosystem brand, collects, uses and protects your personal data on its websites.',
  sections: [
    {
      title: 'What we collect',
      list: [
        'Your account: name, email, mobile number, user ID and, if you set one, a password (stored only as a salted hash).',
        'What you order: the service, your answers to its questions, messages with our team and the documents you share.',
        'Payments: wallet entries in your account. Card and UPI payments are handled by Razorpay; we never see your card details.',
        'Bharat ID: the details in your application. Of your Aadhaar and bank account numbers we keep only the last 4 digits.',
        'Support tickets, Pirento AI chats, Intern exam attempts and Vault files you choose to store.',
      ],
    },
    {
      title: 'How we keep it safe',
      list: [
        'Vault files and passwords, and Bharat ID KYC videos, are encrypted at rest (AES-256-GCM).',
        'A KYC video is deleted once your Bharat ID is approved.',
        'Your sign-in stays in a cookie the page itself cannot read; the short-lived access key is kept only in memory.',
        'Staff see only what their role needs, and every staff change is recorded in an audit trail.',
      ],
    },
    {
      title: 'How we use it',
      list: [
        'To sign you in, with codes sent to your email or mobile.',
        'To do the work you order, keep you updated and answer your questions.',
        'To keep records the law asks of us, such as payments and tax records.',
        'We do not sell your personal data.',
      ],
    },
    {
      title: 'Deleting your data',
      body: [
        'You can ask us to delete your account from your dashboard. Once approved, we remove your profile and the personal data each product keeps; orders and payments stay on record without your name, for accounts and tax records. Saved Pirento AI chats can also be deleted one by one at any time.',
      ],
    },
    {
      title: 'Contact',
      body: ['For any question about your data, write to support@pirento.com or open a ticket on the Support page.'],
    },
  ],
};

export const refunds = {
  updated: '20 November 2026',
  intro: 'What happens to your money when an order is cancelled, and how to take money out of your wallet.',
  sections: [
    {
      title: 'Before you pay',
      body: [
        'An order you have not paid for can be cancelled at any time. If you used a coupon on it, the coupon use is returned to you.',
      ],
    },
    {
      title: 'Orders paid from your wallet',
      body: [
        'If our team cancels an order you paid from your Pirento wallet, the full amount goes back to your wallet automatically, with a matching entry in your wallet history.',
      ],
    },
    {
      title: 'Orders paid by card or UPI',
      body: [
        'If an order paid by card or UPI is cancelled, our team returns the amount through Razorpay to the account you paid from. Your bank decides how long it takes to show.',
      ],
    },
    {
      title: 'Work already done',
      body: [
        'Where our team has already started or finished the work, or a government fee has been paid on your behalf, tell us through Support and our team reviews the request with you.',
      ],
    },
    {
      title: 'Withdrawing wallet money',
      body: [
        'You can ask to withdraw your wallet balance from your wallet page. Our finance team reviews each request before the money is sent.',
      ],
    },
    {
      title: 'Contact',
      body: ['Write to support@pirento.com or open a ticket on the Support page, with your order number.'],
    },
  ],
};
