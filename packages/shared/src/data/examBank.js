const general = [
  {
    id: 'gen-1',
    skill: 'theoretical',
    question: 'What is the primary purpose of version control systems like Git?',
    options: [
      'Compiling code faster',
      'Tracking and managing changes to files over time',
      'Hosting websites',
      'Encrypting source code',
    ],
    answer: 1,
  },
  {
    id: 'gen-2',
    skill: 'practical',
    question: 'A stakeholder reports a bug you cannot reproduce. What is the best first step?',
    options: [
      'Close the report as invalid',
      'Ask for exact steps, environment, and expected vs actual behaviour',
      'Rewrite the feature from scratch',
      'Escalate to management immediately',
    ],
    answer: 1,
  },
  {
    id: 'gen-3',
    skill: 'theoretical',
    question: 'In agile development, what is a "sprint"?',
    options: [
      'A production outage',
      'A fixed time-box in which a set of work is completed',
      'The final release build',
      'A type of standup meeting',
    ],
    answer: 1,
  },
  {
    id: 'gen-4',
    skill: 'practical',
    question: 'You are blocked on a task for two hours. The most professional next move is to…',
    options: [
      'Stay silent and keep trying for days',
      'Switch to personal work',
      'Document what you tried and ask your mentor with that context',
      'Delete the task',
    ],
    answer: 2,
  },
  {
    id: 'gen-5',
    skill: 'theoretical',
    question: 'Which of these best describes an API?',
    options: [
      'A database index',
      'A contract that lets software systems talk to each other',
      'A styling framework',
      'A deployment server',
    ],
    answer: 1,
  },
  {
    id: 'gen-6',
    skill: 'practical',
    question: 'Before submitting deliverable work, you should…',
    options: [
      'Send it immediately to save time',
      'Review it against the requirements and test the main flows',
      'Wait for someone to ask for it',
      'Compress it into an archive',
    ],
    answer: 1,
  },
  {
    id: 'gen-7',
    skill: 'theoretical',
    question: 'What does "MVP" stand for in product development?',
    options: [
      'Most Valuable Programmer',
      'Minimum Viable Product',
      'Maximum Version Protocol',
      'Managed Vendor Platform',
    ],
    answer: 1,
  },
  {
    id: 'gen-8',
    skill: 'practical',
    question: "A teammate's review comment points out a real mistake in your work. You should…",
    options: [
      'Defend the mistake to save face',
      'Ignore the comment',
      'Acknowledge it, fix it, and note the learning',
      'Ask them to fix it themselves',
    ],
    answer: 2,
  },
  {
    id: 'gen-9',
    skill: 'theoretical',
    question: 'Why are deadlines broken into milestones?',
    options: [
      'To create more meetings',
      'To make progress measurable and surface risk early',
      'Because tools require it',
      'To reduce documentation',
    ],
    answer: 1,
  },
  {
    id: 'gen-10',
    skill: 'practical',
    question: 'You finish your assigned work early. The best use of the remaining time is to…',
    options: [
      'Log off quietly',
      "Polish, test, and offer help on the team's open items",
      'Start an unrelated personal project',
      'Refactor everything without telling anyone',
    ],
    answer: 1,
  },
];

const webDevelopment = [
  {
    id: 'web-1',
    skill: 'theoretical',
    question: 'What does the CSS box model consist of, inside-out?',
    options: [
      'Margin, border, padding, content',
      'Content, padding, border, margin',
      'Content, margin, border, padding',
      'Padding, content, margin, border',
    ],
    answer: 1,
  },
  {
    id: 'web-2',
    skill: 'practical',
    question: 'A page renders fine on desktop but overflows horizontally on phones. A sound first check is…',
    options: [
      'Remove all CSS',
      'Look for fixed widths and missing max-width/flex-wrap on wide elements',
      'Increase the viewport zoom',
      'Switch frameworks',
    ],
    answer: 1,
  },
  {
    id: 'web-3',
    skill: 'theoretical',
    question: 'What is the difference between HTTP GET and POST?',
    options: [
      'GET is faster',
      'GET retrieves data; POST submits data that changes server state',
      'POST is only for files',
      'There is no difference',
    ],
    answer: 1,
  },
  {
    id: 'web-4',
    skill: 'practical',
    question: 'An API call fails intermittently in production. The most useful diagnostic is…',
    options: [
      'Retrying until it works',
      'Logging status codes, latency, and payloads around the failure',
      'Disabling error reporting',
      'Blaming the network',
    ],
    answer: 1,
  },
  {
    id: 'web-5',
    skill: 'theoretical',
    question: 'Why should user input always be validated on the server, even if the form validates it?',
    options: [
      'Browsers are slow',
      'Client-side checks can be bypassed entirely',
      'It doubles performance',
      'HTML requires it',
    ],
    answer: 1,
  },
  {
    id: 'web-6',
    skill: 'practical',
    question: 'The fastest way to find why a React component re-renders too often is to…',
    options: [
      'Add more state',
      'Inspect its props/state changes with the React devtools profiler',
      'Convert it to a class',
      'Wrap everything in useMemo blindly',
    ],
    answer: 1,
  },
  {
    id: 'web-7',
    skill: 'theoretical',
    question: 'What is the purpose of an HTTP status code 401 vs 403?',
    options: [
      'They are interchangeable',
      '401 = not authenticated; 403 = authenticated but not allowed',
      '401 = server error; 403 = client error',
      '401 = redirect; 403 = success',
    ],
    answer: 1,
  },
  {
    id: 'web-8',
    skill: 'practical',
    question: 'A database list endpoint slows down as data grows. The first fix to evaluate is…',
    options: [
      'A bigger server',
      'An index matching the query + pagination',
      'Caching everything forever',
      'Removing the endpoint',
    ],
    answer: 1,
  },
  {
    id: 'web-9',
    skill: 'theoretical',
    question: 'What does CORS control?',
    options: ['Database access', 'Which origins may call an API from a browser', 'Image compression', 'CSS priorities'],
    answer: 1,
  },
  {
    id: 'web-10',
    skill: 'practical',
    question: 'Secrets like API keys belong in…',
    options: [
      'The frontend bundle',
      'Git history',
      'Environment variables/secret managers, never the repo',
      'Code comments',
    ],
    answer: 2,
  },
];

const dataScience = [
  {
    id: 'ds-1',
    skill: 'theoretical',
    question: 'What is overfitting?',
    options: [
      'A model too simple for the data',
      'A model that memorizes training data and generalizes poorly',
      'A dataset with missing values',
      'A slow training loop',
    ],
    answer: 1,
  },
  {
    id: 'ds-2',
    skill: 'practical',
    question: 'Your dataset has 5% missing values in one column. A reasonable first approach is…',
    options: [
      'Delete the whole dataset',
      'Understand why they are missing, then impute or drop with justification',
      'Replace them with zeros always',
      'Ignore and train anyway',
    ],
    answer: 1,
  },
  {
    id: 'ds-3',
    skill: 'theoretical',
    question: 'Mean vs median — when is median preferred?',
    options: [
      'Never',
      'When the distribution has strong outliers/skew',
      'When data is normally distributed',
      'When n is large',
    ],
    answer: 1,
  },
  {
    id: 'ds-4',
    skill: 'practical',
    question: 'Before modeling, the single most valuable step is…',
    options: [
      'Buying GPUs',
      'Exploratory analysis to understand distributions and leakage',
      'Choosing the deepest network',
      'Publishing results',
    ],
    answer: 1,
  },
  {
    id: 'ds-5',
    skill: 'theoretical',
    question: 'What does a train/test split protect against?',
    options: ['Slow training', 'Evaluating on data the model has already seen', 'Large files', 'Class imbalance'],
    answer: 1,
  },
  {
    id: 'ds-6',
    skill: 'practical',
    question: 'A 99% accuracy on fraud detection with 1% fraud rate most likely means…',
    options: [
      'A perfect model',
      'The model may be predicting "not fraud" always — check precision/recall',
      'The data is clean',
      'Nothing further to check',
    ],
    answer: 1,
  },
  {
    id: 'ds-7',
    skill: 'theoretical',
    question: 'Correlation vs causation: seeing two variables move together means…',
    options: [
      'One causes the other',
      'They are associated; causation needs controlled evidence',
      'The data is wrong',
      'They are independent',
    ],
    answer: 1,
  },
  {
    id: 'ds-8',
    skill: 'practical',
    question: 'Your model performs worse in production than in testing. First suspicion:',
    options: [
      'Users are wrong',
      'Data drift or a training/serving mismatch',
      'The cloud is slow',
      'Nothing can be done',
    ],
    answer: 1,
  },
  {
    id: 'ds-9',
    skill: 'theoretical',
    question: 'What is a p-value?',
    options: [
      'The probability the hypothesis is true',
      'The probability of results at least this extreme if the null hypothesis holds',
      'The sample size',
      'The effect size',
    ],
    answer: 1,
  },
  {
    id: 'ds-10',
    skill: 'practical',
    question: 'Sharing findings with non-technical stakeholders works best as…',
    options: [
      'Raw notebooks',
      'A clear narrative with a few decisive charts and caveats',
      'Model weights',
      'SQL dumps',
    ],
    answer: 1,
  },
];

const marketing = [
  {
    id: 'mkt-1',
    skill: 'theoretical',
    question: 'What is a conversion funnel?',
    options: [
      'A paid ads format',
      'The staged path from awareness to action that users move through',
      'An email template',
      'A social network',
    ],
    answer: 1,
  },
  {
    id: 'mkt-2',
    skill: 'practical',
    question: 'An ad campaign gets clicks but no signups. The first place to investigate is…',
    options: ['The logo', "The landing page's message match and friction", 'The office hours', "The CEO's bio"],
    answer: 1,
  },
  {
    id: 'mkt-3',
    skill: 'theoretical',
    question: 'CAC and LTV are compared to judge…',
    options: [
      'Brand colors',
      'Whether acquiring a customer costs less than their lifetime value',
      'Website uptime',
      'Employee retention',
    ],
    answer: 1,
  },
  {
    id: 'mkt-4',
    skill: 'practical',
    question: 'For an A/B test to be trustworthy you need…',
    options: [
      'Two opinions',
      'A single changed variable, enough sample size, and a pre-chosen metric',
      'A bigger budget',
      'A/B/C/D variants always',
    ],
    answer: 1,
  },
  {
    id: 'mkt-5',
    skill: 'theoretical',
    question: 'SEO primarily improves…',
    options: [
      'Paid ad costs',
      'Organic discoverability in search engines',
      'Email deliverability',
      'App store ratings',
    ],
    answer: 1,
  },
  {
    id: 'mkt-6',
    skill: 'practical',
    question: 'Open rates dropped after a subject-line change. You should…',
    options: [
      'Panic',
      'Revert/test against the previous line on a controlled segment',
      'Email more often',
      'Buy a list',
    ],
    answer: 1,
  },
  {
    id: 'mkt-7',
    skill: 'theoretical',
    question: 'What is a buyer persona?',
    options: [
      'A legal document',
      'A research-based profile of a target customer segment',
      'A pricing tier',
      'An influencer',
    ],
    answer: 1,
  },
  {
    id: 'mkt-8',
    skill: 'practical',
    question: 'The most defensible metric for a content program is…',
    options: [
      'Total impressions alone',
      'Qualified conversions attributed to the content',
      'Number of posts',
      'Follower count',
    ],
    answer: 1,
  },
  {
    id: 'mkt-9',
    skill: 'theoretical',
    question: 'Retargeting means…',
    options: [
      'Changing the company mission',
      'Advertising to users who already interacted with you',
      'Emailing new leads',
      'Renaming a product',
    ],
    answer: 1,
  },
  {
    id: 'mkt-10',
    skill: 'practical',
    question: 'Before launching a campaign, the brief must at minimum define…',
    options: ['Fonts', 'Audience, message, channel, budget, and the success metric', 'Office location', 'A hashtag'],
    answer: 1,
  },
];

const design = [
  {
    id: 'dsg-1',
    skill: 'theoretical',
    question: 'Visual hierarchy is about…',
    options: [
      'File organization',
      'Guiding the eye to what matters first through size, weight, and contrast',
      'Company org charts',
      'Layer naming',
    ],
    answer: 1,
  },
  {
    id: 'dsg-2',
    skill: 'practical',
    question: 'A client says a design "feels off" without specifics. Your best move:',
    options: [
      'Start over',
      'Ask targeted questions and present 2–3 focused variations',
      'Ignore them',
      'Add more colors',
    ],
    answer: 1,
  },
  {
    id: 'dsg-3',
    skill: 'theoretical',
    question: 'What is the accessibility contrast ratio floor for body text (WCAG AA)?',
    options: ['1.5:1', '4.5:1', '10:1', '2:1'],
    answer: 1,
  },
  {
    id: 'dsg-4',
    skill: 'practical',
    question: 'Testing a new checkout design before build is best done with…',
    options: [
      'A launch',
      'A clickable prototype and a handful of usability sessions',
      'A survey of designers only',
      'Intuition',
    ],
    answer: 1,
  },
  {
    id: 'dsg-5',
    skill: 'theoretical',
    question: 'White space in a layout…',
    options: [
      'Is wasted space',
      'Creates grouping, breathing room, and emphasis',
      'Only matters in print',
      'Should always be filled',
    ],
    answer: 1,
  },
  {
    id: 'dsg-6',
    skill: 'practical',
    question: 'Handing a design to developers, the most important artifact is…',
    options: [
      'A JPEG',
      'Specs/tokens for spacing, type, states, and responsive behaviour',
      'A moodboard',
      'The raw sketch file only',
    ],
    answer: 1,
  },
  {
    id: 'dsg-7',
    skill: 'theoretical',
    question: 'A design system exists to…',
    options: [
      'Limit creativity',
      'Make product UI consistent and faster to build at scale',
      'Replace designers',
      'Store stock photos',
    ],
    answer: 1,
  },
  {
    id: 'dsg-8',
    skill: 'practical',
    question: 'Mobile-first design means…',
    options: [
      'Ignoring desktop',
      'Designing the constrained view first, then enhancing upward',
      'Using only native apps',
      'Smaller fonts everywhere',
    ],
    answer: 1,
  },
  {
    id: 'dsg-9',
    skill: 'theoretical',
    question: 'Serif vs sans-serif choice should be driven by…',
    options: ['Personal taste only', 'Brand voice, medium, and legibility at target sizes', 'File size', 'Trend lists'],
    answer: 1,
  },
  {
    id: 'dsg-10',
    skill: 'practical',
    question: 'When usability testing contradicts your favorite concept, you…',
    options: [
      'Discard the test',
      'Follow the evidence and iterate the concept',
      'Test different users until they agree',
      'Ship both',
    ],
    answer: 1,
  },
];

const BANKS = {
  general: general,
  'web-development': webDevelopment,
  'data-science': dataScience,
  marketing: marketing,
  design: design,
};

/** Resolves a free-form track label to a bank; unknown tracks get 'general'. */
export function bankFor(track) {
  const slug = (track ?? '').toLowerCase().trim().replace(/\s+/g, '-');
  for (const key of Object.keys(BANKS)) {
    if (key !== 'general' && (slug.includes(key) || key.includes(slug)) && slug.length >= 4) {
      return {track: key, questions: BANKS[key]};
    }
  }
  return {track: 'general', questions: BANKS.general};
}
