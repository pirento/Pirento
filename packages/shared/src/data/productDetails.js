// The longer story on each product's home page: more of what it does, who it
// is for, and which products go well with it. Only what is built today.

export const PRODUCT_DETAILS = {
  legal: {
    more: [
      {
        title: 'Compliance filings',
        body: 'Annual returns, ROC filings and changes to your company, each with its own price.',
      },
      {title: 'Trademarks', body: 'Trademark search, registration, objections and renewals handled by our team.'},
      {
        title: 'Track every step',
        body: 'Each order shows its status and our notes in your dashboard, and ends with an LGL- code.',
      },
    ],
    audience: [
      {title: 'Founders', body: 'Register the company, get GST and keep the yearly filings on time.'},
      {title: 'Small businesses', body: 'Licences, registrations and notices without hunting for the right office.'},
      {title: 'Individuals', body: 'Agreements, affidavits, property papers and a lawyer to talk to.'},
    ],
    related: ['black', 'bharat-id', 'ai'],
  },
  black: {
    more: [
      {
        title: 'Due dates in one place',
        body: 'Tell us when the filing is due at checkout; it is on the order from day one.',
      },
      {title: 'Paid once', body: 'Pay from your wallet or by card and UPI; the price never changes after you order.'},
      {title: 'Done by people', body: 'Our team prepares and files the work. Nothing is filed automatically.'},
    ],
    audience: [
      {title: 'Salaried people', body: 'Your ITR filed by someone who checks it first.'},
      {title: 'Traders and shops', body: 'Monthly and quarterly GST returns and TDS, at a fixed price.'},
      {title: 'Growing companies', body: 'Bookkeeping and business documents without a full-time accountant.'},
    ],
    related: ['legal', 'capital', 'vault'],
  },
  green: {
    more: [
      {title: 'From one tree to 500', body: 'Sponsor as many trees as you like in a single order.'},
      {title: 'Pay from your wallet', body: 'Or by card and UPI. The price per tree is set by the drive.'},
      {title: 'Gift a tree', body: 'Sponsor for someone else and tell us their name in the notes.'},
    ],
    audience: [
      {title: 'Individuals', body: 'Mark a birthday, a new job or a memory with trees on a drive.'},
      {title: 'Companies', body: 'Sponsor trees for your team or clients and keep the record.'},
      {title: 'Schools and groups', body: 'Pool together for a drive and keep one shared record.'},
    ],
    related: ['giftox', 'one', 'intern'],
  },
  intern: {
    more: [
      {title: 'Skill breakdown', body: 'Your certificate shows how you scored in each skill area, not just a total.'},
      {title: 'Fair retakes', body: 'Missed the mark? A retake opens after 24 hours.'},
      {title: 'Free', body: 'No fee for the exam or the certificate.'},
    ],
    audience: [
      {title: 'Students', body: 'Show what you know before your first internship.'},
      {title: 'Career changers', body: 'Test yourself in a new field: web, data, marketing or design.'},
      {title: 'Recruiters', body: 'Check any certificate on its public page in seconds.'},
    ],
    related: ['bharat-id', 'ai', 'one'],
  },
  ai: {
    more: [
      {title: 'Hindi and English', body: 'Ask in Hindi, English or a mix of both; it answers the same way.'},
      {title: 'Straight to the service', body: 'When a Pirento service fits, the answer links to it with its price.'},
      {title: 'Your history, your call', body: 'Delete a conversation any time and it is gone from your account.'},
    ],
    audience: [
      {title: 'First-time founders', body: 'Find out which registration or licence you need before you pay for one.'},
      {title: 'Busy owners', body: 'Quick answers on GST, filings and paperwork between other work.'},
      {title: 'Anyone unsure', body: 'Describe your problem in your own words and get pointed the right way.'},
    ],
    related: ['legal', 'black', 'giftox'],
  },
  vault: {
    more: [
      {title: 'Fresh IV per item', body: 'Every file and password is sealed with its own random IV and an auth tag.'},
      {title: 'Never shown in lists', body: 'Passwords stay hidden until you ask to reveal one.'},
      {title: 'Safe downloads', body: 'Files download as files; they are never opened inside the browser.'},
    ],
    audience: [
      {title: 'Families', body: 'Keep copies of IDs, certificates and policies in one place.'},
      {title: 'Freelancers', body: 'Contracts, invoices and client logins kept apart from your phone.'},
      {title: 'Small teams', body: 'Store the papers your business needs on hand.'},
    ],
    related: ['bharat-id', 'legal', 'black'],
  },
  one: {
    more: [
      {
        title: 'Every product counts',
        body: 'Your code works on orders across every Pirento site that sells a service.',
      },
      {title: 'Live status', body: 'See when a referred order is paid, in progress or done.'},
      {title: 'One click to start', body: 'No form to fill: join and your code is ready.'},
    ],
    audience: [
      {title: 'Consultants', body: 'Send clients to services you trust and keep track of them.'},
      {title: 'Community leaders', body: 'Share one link with your group.'},
      {title: 'Creators', body: 'Put your link where your audience already is.'},
    ],
    related: ['legal', 'black', 'giftox'],
  },
  capital: {
    more: [
      {title: 'Reducing balance', body: 'The calculator uses the standard reducing-balance EMI formula.'},
      {title: 'See the full cost', body: 'Monthly payment, total interest and total paid, side by side.'},
      {title: 'Tell us your need', body: 'Your waitlist note helps us build the right loans first.'},
    ],
    audience: [
      {title: 'Small businesses', body: 'Plan working capital before you speak to any lender.'},
      {title: 'Individuals', body: 'Compare terms and see what a loan really costs.'},
      {title: 'Early adopters', body: 'Be first to hear when Pirento Capital opens.'},
    ],
    related: ['black', 'legal', 'bharat-id'],
  },
  'bharat-id': {
    more: [
      {title: 'Saved as you go', body: 'Each of the seven steps saves on its own, so you can stop and come back.'},
      {
        title: 'Video KYC and eSign on Digio',
        body: 'A video KYC on Digio shows it is really you, and you sign your declaration with Aadhaar eSign.',
      },
      {title: 'Less kept, less at risk', body: 'Only the last 4 digits of your Aadhaar and bank account are stored.'},
    ],
    audience: [
      {title: 'Pirento customers', body: 'One reviewed identity across every Pirento product.'},
      {title: 'Interns', body: 'Pair your certificate with a verified identity.'},
      {title: 'Anyone checking', body: 'Verify an ID on its public page with the number or QR.'},
    ],
    related: ['vault', 'intern', 'capital'],
  },
  giftox: {
    more: [
      {title: 'Up to 50 at once', body: 'Order up to 50 of the same box in one go for a team or event.'},
      {title: 'Any occasion', body: 'Festivals, welcomes, thank-yous and celebrations; tell us which at checkout.'},
      {title: 'Paid once', body: 'Pay from your wallet or by card and UPI; the box price is fixed.'},
    ],
    audience: [
      {title: 'HR teams', body: 'Welcome kits and festival boxes for everyone on the team.'},
      {title: 'Founders and sales', body: 'Thank a client with a box that arrives at their door.'},
      {title: 'Families and friends', body: 'Send a box to someone far away for their big day.'},
    ],
    related: ['green', 'one', 'ai'],
  },
};
