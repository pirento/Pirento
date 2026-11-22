// The Privacy Policy and the Refund and Cancellation Policy. Each line describes what the site and its services
// actually do; change the text here when the code changes. The Terms live in site.js (they carry TERMS_VERSION).

export const privacy = {
  updated: '22 November 2026',
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
        'Bharat ID verification is done with Digio: it receives your name, email and the declaration you sign, and runs your video KYC and Aadhaar eSign.',
        'Support tickets, Pirento AI chats, Intern exam attempts and Vault files you choose to store.',
      ],
    },
    {
      title: 'How we keep it safe',
      list: [
        'Vault files and passwords are encrypted at rest (AES-256-GCM).',
        'Bharat ID video KYC and the Aadhaar eSign of your declaration run on Digio; the KYC video and the signed document stay with Digio, and Pirento keeps only their result.',
        'Videos recorded on Pirento before KYC moved to Digio stay encrypted at rest (AES-256-GCM) and are deleted once the ID is approved.',
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
        'An order you have not paid for can be cancelled at any time. A discount code only counts as used once you pay, so cancelling leaves it unused.',
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

// What each product keeps beyond your Pirento account, and what it shows publicly. Product sites build their
// own Terms, Privacy Policy and Refund Policy from this plus the main pages (features/ecosystem/LegalPage.jsx).
const ORDER_DATA = [
  'Your orders: the service, your answers to its questions, the documents you upload and your messages with our team.',
  'The payments for those orders, from your wallet or by card or UPI through Razorpay.',
];
export const PRODUCT_LEGAL = {
  legal: {keeps: ORDER_DATA},
  black: {keeps: ORDER_DATA},
  green: {
    keeps: ['Your tree sponsorship orders and their payments.', 'The record of each sponsorship in your account.'],
  },
  giftox: {
    keeps: [
      'Your gift box orders and their payments.',
      'The delivery address and recipient details you give, used only to deliver the box.',
    ],
  },
  intern: {
    keeps: ['The track you pick, your exam attempts and results.', 'The certificates you earn.'],
    public:
      'A certificate’s verify page shows anyone with its code the name on it, the track, the score and the skills.',
  },
  ai: {
    keeps: [
      'Your chats, saved in your account until you delete them.',
      'To answer, your messages are sent to Anthropic’s Claude model, the AI service Pirento AI runs on.',
    ],
  },
  vault: {
    keeps: [
      'The files and passwords you store, encrypted at rest (AES-256-GCM).',
      'Vault is not end-to-end encrypted: our servers hold the keys, so do not store what you could not share with us.',
    ],
  },
  one: {keeps: ['Your partner code and the orders placed with it.']},
  capital: {
    keeps: [
      'Your waitlist request and the contact details you give with it.',
      'The EMI calculator works in your browser; its numbers are not sent to us.',
    ],
  },
  'bharat-id': {
    keeps: [
      'The details in your application. Of your Aadhaar and bank account numbers we keep only the last 4 digits.',
      'Where your Digio video KYC and declaration signing stand. The KYC video and the signed declaration stay with Digio; staff open them from there.',
    ],
    public:
      'Your Bharat ID’s verify page shows anyone with the ID your first name and last initial, your state and the issue date.',
  },
};
