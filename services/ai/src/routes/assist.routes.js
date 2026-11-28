// The AI tools in every product (customer side) and for staff: POST /assist/:kind runs one job. Each kind checks its
// own input, gathers the person's own data on the server where it needs it (never from the browser), and takes one
// message from the daily allowance, given back if the AI fails.
import {Router} from 'express';
import {z} from 'zod';
import {ID_SECTIONS, SERVICES, emi, serviceQuestions} from '@pirento/shared';
import {ACCESS, ApiError, callService, notFound, requireAuth} from '@pirento/shared/server';
import {config} from '../config.js';
import {readSettings} from '../models/Settings.js';
import {knowledgeText} from '../lib/knowledge.js';
import {runJob} from '../lib/jobs.js';
import {allowanceOf} from '../lib/plans.js';
import {giveBack, takeOne} from '../lib/usage.js';

export const assistRoutes = Router();

const slug = z.string().max(30);
const lang = z.enum(['English', 'Hindi', 'Hinglish']).default('English');
const text = (max) => z.string().trim().max(max);
const file = z.object({
  name: text(120).min(1),
  type: z.enum(['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  data: z.base64().max(7_000_000, 'Attach a file up to 5 MB'),
});
const attach = (f) => ({
  type: f.type === 'application/pdf' ? 'document' : 'image',
  source: {type: 'base64', media_type: f.type, data: f.data},
});

/** The priced catalogue the AI may pick from, optionally one product's. */
const catalogue = (product) =>
  SERVICES.filter((s) => s.price && (!product || s.product === product)).map((s) => ({
    slug: s.slug,
    name: s.name,
    product: s.product,
    rupees: s.price,
  }));
const known = (slugs, list) =>
  slugs
    .map((x) => list.find((s) => s.slug === (x.slug ?? x)))
    .filter(Boolean)
    .map((s) => ({...s, link: `/services/${s.slug}`}));

/** A person's own summary in one area (the same reads the chat assistant uses). */
const area = (name, userId) => callService(config.areas[name], '/internal/assistant', {userId}).catch(() => null);

const today = () => new Date().toISOString().slice(0, 10);

/** A service as it sells now (with admin edits), and its checkout questions; 404 when there is no such service. */
async function liveService(slug) {
  const service = await callService(config.catalogUrl, '/internal/service', {slug}).catch(() => null);
  if (!service) throw notFound('No such service');
  return service;
}

/** The person's own order, as facts for the AI; the orders service refuses anyone else's. */
const ownOrder = (req, orderId) =>
  callService(config.areas.orders, '/internal/order-summary', {orderId, userId: req.user.sub}).catch((err) => {
    throw err.status === 404 ? notFound('Order not found') : err;
  });
const orderId = z.string().regex(/^[a-f0-9]{24}$/, 'No such order');
const QUESTION_KEYS = ['id', 'label', 'type', 'options', 'required'];

/**
 * kind → {input: zod schema, gather(req, body) → {input, attachments?, notes?}, after?(out, body), staff?: roles}.
 * The numbers are the list the user picked from (docs/AI.md).
 */
export const ASSISTS = {
  recommend: {
    // 1 smart search, 3 legal chooser, 11 gift suggestion
    input: z.object({
      need: text(600).min(3, 'Say what you need'),
      product: slug.default(''),
      budget: z.number().int().min(0).max(10_000_000).optional(),
      forWhom: text(80).default(''),
    }),
    gather: (_req, b) => ({input: {...b, catalogue: catalogue(b.product)}, notes: true}),
    after: (out, b) => ({
      picks: known(out.picks, catalogue(b.product)).map((s) => ({
        ...s,
        why: out.picks.find((p) => p.slug === s.slug)?.why,
      })),
      note: out.note,
    }),
  },
  monthly: {
    // 2
    input: z.object({language: lang}),
    gather: async (req, b) => ({
      input: {
        language: b.language,
        today: today(),
        account: Object.fromEntries(
          await Promise.all(Object.keys(config.areas).map(async (a) => [a, await area(a, req.user.sub)])),
        ),
      },
    }),
  },
  willDraft: {
    // Vault → Will: the person's own words in, a first draft out; nothing is read from their vault.
    input: z.object({
      testator: text(300).min(3, 'Your full name, age and city'),
      family: text(1500).default(''),
      assets: text(3000).min(5, 'List what you own'),
      bequests: text(3000).min(5, 'Say who gets what'),
      executor: text(300).min(3, 'Name an executor'),
      guardian: text(300).default(''),
      wishes: text(1500).default(''),
      language: lang,
    }),
    gather: (_req, b) => ({input: b}),
  },
  draftDoc: {
    // 4
    input: z.object({
      docType: z.enum([
        'Rent agreement',
        'Non-disclosure agreement (NDA)',
        'Legal notice',
        'Partnership deed',
        'Affidavit',
        'Employment offer letter',
      ]),
      parties: text(600).min(3, 'Name the parties'),
      details: text(3000).min(10, 'Give the key details'),
      language: lang,
    }),
    gather: (_req, b) => ({input: b}),
  },
  explainDoc: {
    // 5, 8
    input: z.object({file, question: text(600).default(''), product: slug.default(''), language: lang}),
    gather: (_req, b) => ({
      input: {question: b.question, language: b.language, catalogue: catalogue(b.product)},
      attachments: [attach(b.file)],
    }),
    after: (out, b) => ({...out, services: known(out.services, catalogue(b.product))}),
  },
  compliance: {
    // 6
    input: z.object({
      items: z
        .array(
          z.enum([
            'GST monthly (GSTR-1, GSTR-3B)',
            'GST quarterly (QRMP)',
            'Income tax: individual',
            'Income tax: business with audit',
            'TDS returns',
            'Company annual filing (ROC)',
          ]),
        )
        .min(1, 'Pick at least one'),
    }),
    gather: (_req, b) => ({input: {...b, today: today()}}),
  },
  greenImpact: {
    // 9
    input: z.object({language: lang}),
    gather: async (req, b) => ({
      input: {
        language: b.language,
        greenOrders: ((await area('orders', req.user.sub)) ?? []).filter((o) => o.product === 'green'),
      },
    }),
  },
  csrReport: {
    // 10
    input: z.object({company: text(120).min(2), year: text(20).default(''), notes: text(2000).default('')}),
    gather: async (req, b) => ({
      input: {...b, greenOrders: ((await area('orders', req.user.sub)) ?? []).filter((o) => o.product === 'green')},
    }),
  },
  giftMessage: {
    // 12
    input: z.object({
      to: text(80).min(1),
      occasion: text(80).min(2),
      tone: z.enum(['Warm', 'Funny', 'Formal', 'Romantic']).default('Warm'),
      from: text(80).default(''),
      language: lang,
    }),
    gather: (_req, b) => ({input: b}),
  },
  tutor: {
    // 13: the lesson is public, so the page sends it
    input: z.object({lessonTitle: text(120).min(1), lessonText: text(6000).min(1), question: text(600).default('')}),
    gather: (_req, b) => ({input: b}),
  },
  interview: {
    // 14
    input: z.object({
      track: text(60).min(2),
      turns: z.array(z.object({question: text(600), answer: text(2000)})).max(5),
    }),
    gather: (_req, b) => ({input: b}),
  },
  idHelp: {
    // 15: the step and a question only, never the values typed
    input: z.object({step: z.enum(ID_SECTIONS.map((s) => s.id)), question: text(600).default('')}),
    gather: (_req, b) => {
      const s = ID_SECTIONS.find((x) => x.id === b.step);
      return {input: {step: s.title, fields: s.fields.map((f) => f.label), question: b.question}};
    },
  },
  devHelp: {
    // 17
    input: z.object({
      question: text(1000).min(3),
      language: z.enum(['JavaScript', 'Python', 'PHP', 'Java', 'cURL']).default('JavaScript'),
    }),
    gather: (_req, b) => ({input: b}),
  },
  label: {
    // 18: file names only; Vault's encrypted contents never reach the AI
    input: z.object({names: z.array(text(200).min(1)).min(1).max(50)}),
    gather: (_req, b) => ({input: b}),
  },
  shareMessage: {
    // 20
    input: z.object({
      code: text(20).min(2),
      audience: text(120).default('friends and family'),
      platform: z.enum(['WhatsApp', 'Instagram', 'Facebook', 'LinkedIn', 'SMS']).default('WhatsApp'),
      language: lang,
    }),
    gather: (_req, b) => ({input: {...b, link: `https://pirento.com/?ref=${encodeURIComponent(b.code)}`}}),
  },
  partnerCoach: {
    // 21
    input: z.object({language: lang}),
    gather: async (req, b) => ({
      input: {
        language: b.language,
        partner: await callService(config.areas.orders, '/internal/partner-summary', {userId: req.user.sub}).catch(
          () => null,
        ),
      },
    }),
  },
  emiExplain: {
    // 22: the numbers are worked out here; the AI only explains them
    input: z.object({
      amount: z.number().int().min(1000).max(100_000_000),
      ratePercent: z.number().min(0).max(60),
      months: z.number().int().min(1).max(360),
      language: lang,
    }),
    gather: (_req, b) => {
      const monthly = Math.round(emi(b.amount, b.ratePercent, b.months));
      return {
        input: {...b, monthlyEmi: monthly, totalPaid: monthly * b.months, interest: monthly * b.months - b.amount},
      };
    },
    after: (out, b) => {
      const monthly = Math.round(emi(b.amount, b.ratePercent, b.months));
      return {...out, monthlyEmi: monthly, totalPaid: monthly * b.months, interest: monthly * b.months - b.amount};
    },
  },

  // ---- Pirento Legal (docs/AI.md, Legal 1–13; staff ones run in the orders service) ----
  intake: {
    // 1: the checkout questions filled by talking; answers checked against the questions here
    input: z.object({
      serviceSlug: slug.min(1),
      turns: z.array(z.object({question: text(600), answer: text(1000)})).max(15),
    }),
    gather: async (_req, b) => {
      const service = await liveService(b.serviceSlug);
      const questions = serviceQuestions(service).map((q) => Object.fromEntries(QUESTION_KEYS.map((k) => [k, q[k]])));
      return {input: {service: service.name, questions, turns: b.turns}, questions};
    },
    after: (out, _b, ctx) => {
      const byId = Object.fromEntries(ctx.questions.map((q) => [q.id, q]));
      const answers = {};
      for (const {id, value} of out.answers) {
        const q = byId[id];
        if (q && value && (!q.options?.length || q.options.includes(value))) answers[id] = value.slice(0, 500);
      }
      return {question: out.question, done: out.done, answers};
    },
  },
  checklist: {
    // 2
    input: z.object({serviceSlug: slug.min(1), situation: text(600).default(''), language: lang}),
    gather: async (_req, b) => ({
      input: {service: (await liveService(b.serviceSlug)).name, situation: b.situation, language: b.language},
    }),
  },
  contractReview: {
    // 3
    input: z.object({file, side: text(120).default('the customer'), question: text(600).default(''), language: lang}),
    gather: (_req, b) => ({
      input: {side: b.side, question: b.question, language: b.language, catalogue: catalogue('legal')},
      attachments: [attach(b.file)],
    }),
    after: (out) => ({...out, services: known(out.services, catalogue('legal'))}),
  },
  noticeReply: {
    // 4
    input: z.object({file, facts: text(3000).min(10, 'Tell your side of it'), language: lang}),
    gather: (_req, b) => ({input: {facts: b.facts, language: b.language}, attachments: [attach(b.file)]}),
  },
  orderAsk: {
    // 5
    input: z.object({orderId, question: text(600).min(3, 'Ask a question'), language: lang}),
    gather: async (req, b) => ({
      input: {order: await ownOrder(req, b.orderId), question: b.question, language: b.language},
    }),
  },
  orderStatus: {
    // 6
    input: z.object({orderId, language: lang}),
    gather: async (req, b) => ({input: {order: await ownOrder(req, b.orderId), language: b.language}}),
  },
  consultBrief: {
    // 7 (the customer's side; the lawyer's after-call summary runs in the orders service)
    input: z.object({orderId, notes: text(4000).min(10, 'Write what happened and what you want to ask')}),
    gather: async (req, b) => ({input: {order: await ownOrder(req, b.orderId), notes: b.notes}}),
  },
  translate: {
    // 12
    input: z.object({
      file,
      language: z.enum([
        'Hindi',
        'Marathi',
        'Bengali',
        'Tamil',
        'Telugu',
        'Gujarati',
        'Kannada',
        'Malayalam',
        'Punjabi',
        'Odia',
        'English',
      ]),
    }),
    gather: (_req, b) => ({input: {language: b.language}, attachments: [attach(b.file)]}),
  },
  companyCompliance: {
    // 13
    input: z.object({
      entity: z.enum(['Private limited company', 'One person company', 'LLP', 'Partnership firm', 'Proprietorship']),
      incorporated: z.iso.date().optional(),
      gstRegistered: z.boolean().default(false),
      audit: z.boolean().default(false),
    }),
    gather: (_req, b) => ({input: {...b, today: today()}}),
  },
  impactStory: {
    // 23 (staff)
    staff: ACCESS.ai,
    input: z.object({
      facts: text(3000).min(10),
      audience: z.enum(['Donors', 'Website', 'Social media', 'Annual report']).default('Website'),
    }),
    gather: (_req, b) => ({input: b}),
  },
  adminAnswer: {
    // 24 (staff): only the areas this role may see
    staff: ['support', 'finance', 'staff', 'superadmin'],
    input: z.object({question: text(600).min(3)}),
    gather: async (req, b) => {
      const role = req.user.role;
      const sources = {
        orders: [config.areas.orders, ACCESS.orders],
        tickets: [config.areas.support, ACCESS.support],
        bharatId: [config.areas.bharat_id, ACCESS.identity],
        withdrawals: [config.areas.wallet, ACCESS.payments],
        intern: [config.areas.intern, ACCESS.openings],
      };
      const figures = {};
      await Promise.all(
        Object.entries(sources)
          .filter(([, [, roles]]) => roles.includes(role))
          .map(async ([name, [url]]) => {
            figures[name] = await callService(url, '/internal/staff-summary', {}).catch(() => 'unavailable');
          }),
      );
      return {input: {question: b.question, role, now: new Date().toISOString(), figures}};
    },
  },
};

assistRoutes.post('/assist/:kind', requireAuth, async (req, res) => {
  const a = Object.hasOwn(ASSISTS, req.params.kind) && ASSISTS[req.params.kind];
  if (!a) throw notFound('No such tool');
  if (a.staff && !a.staff.includes(req.user.role))
    throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this');
  const parsed = a.input.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'INVALID_INPUT', parsed.error.issues[0].message);
  // Gathered first: a wrong order or service is refused before any allowance is taken.
  const ctx = await a.gather(req, parsed.data);
  const settings = await readSettings();
  if (!config.enabled) throw new ApiError(503, 'AI_UNAVAILABLE', 'Pirento AI is not switched on yet');
  if (!settings.on) throw new ApiError(503, 'AI_PAUSED', 'Pirento AI is paused for a short while. Try again soon.');
  // Staff tools are work, not the customer's allowance.
  if (!a.staff) {
    const {limit} = await allowanceOf(req.user.sub);
    if (!(await takeOne(req.user.sub, limit))) {
      throw new ApiError(
        429,
        'DAILY_LIMIT',
        `You can use Pirento AI ${limit} times a day. Try again tomorrow, or see the plans.`,
      );
    }
  }
  const {input, attachments, notes} = ctx;
  const out = await runJob(req.params.kind, input, notes ? await knowledgeText() : '', attachments).catch((err) => {
    console.error('assist', req.params.kind, err.message);
    return null;
  });
  if (!out) {
    if (!a.staff) await giveBack(req.user.sub);
    throw new ApiError(502, 'AI_NO_ANSWER', 'The AI could not answer that just now. Please try again.');
  }
  res.json({data: a.after ? a.after(out, parsed.data, ctx) : out});
});
