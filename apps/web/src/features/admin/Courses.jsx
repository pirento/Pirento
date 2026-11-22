// Admin → Intern courses: each track's exam settings, the questions added to its bank (drawn at random per
// attempt) and its lessons with practice questions. Built-in questions live in code and are not listed.
import {useState} from 'react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {TextArea} from '../../components/ui/TextArea';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {selectCls} from '../learning/Pipeline';

const NEW_TRACK = {slug: '', name: '', minutes: 30, passPercent: 60, questions: 10, active: true};
const lines = (text) =>
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

/** Saves and reports; returns true when it worked. */
async function save(fn, setNote) {
  setNote('');
  try {
    await fn();
    return true;
  } catch (err) {
    setNote(`⚠ ${err.message}`);
    return false;
  }
}

function TrackForm({initial, onSaved}) {
  const [t, setT] = useState(initial);
  const [note, setNote] = useState('');
  const set = (k, num) => (e) =>
    setT((x) => ({
      ...x,
      [k]: e.target.type === 'checkbox' ? e.target.checked : num ? Number(e.target.value) : e.target.value,
    }));
  const submit = async (e) => {
    e.preventDefault();
    const {slug, name, minutes, passPercent, questions, active} = t;
    const body = {name, minutes, passPercent, questions, active};
    if (await save(() => api(`/learning/staff/courses/tracks/${slug}`, {method: 'PUT', body}), setNote)) onSaved();
  };
  return (
    <form onSubmit={submit} className="grid items-end gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <Field label="Slug" required disabled={Boolean(initial.slug)} value={t.slug} onChange={set('slug')} />
      <Field label="Name" required value={t.name} onChange={set('name')} />
      <Field label="Minutes" type="number" min={5} max={180} value={t.minutes} onChange={set('minutes', true)} />
      <Field
        label="Pass %"
        type="number"
        min={30}
        max={100}
        value={t.passPercent}
        onChange={set('passPercent', true)}
      />
      <Field
        label="Questions drawn"
        type="number"
        min={3}
        max={100}
        value={t.questions}
        onChange={set('questions', true)}
      />
      <label className="flex items-center gap-2 pb-3 text-sm">
        <input type="checkbox" className="size-4" checked={t.active} onChange={set('active')} /> Taking exams
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-3 xl:col-span-6">
        <Button type="submit" variant="outline" icon={null}>
          Save track
        </Button>
        {note && <p className="text-sm">{note}</p>}
      </div>
    </form>
  );
}

function QuestionForm({track, initial, onSaved, label}) {
  const [q, setQ] = useState(
    initial
      ? {...initial, options: initial.options.join('\n'), answer: initial.answer + 1}
      : {skill: 'theoretical', question: '', options: '', answer: 1, active: true},
  );
  const [note, setNote] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    const body = {
      track,
      skill: q.skill,
      question: q.question,
      options: lines(q.options),
      answer: Number(q.answer) - 1,
      active: q.active,
    };
    const path = initial ? `/learning/staff/courses/questions/${initial._id}` : '/learning/staff/courses/questions';
    const ok = await save(() => api(path, {method: initial ? 'PATCH' : 'POST', body}), setNote);
    if (ok) {
      if (!initial) setQ({skill: q.skill, question: '', options: '', answer: 1, active: true});
      onSaved();
    }
  };
  return (
    <form onSubmit={submit} className="space-y-3 rounded-[18px] border border-rule p-5">
      <TextArea label="Question" rows={2} value={q.question} onChange={(e) => setQ({...q, question: e.target.value})} />
      <TextArea
        label="Options, one per line (2 to 6)"
        rows={4}
        value={q.options}
        onChange={(e) => setQ({...q, options: e.target.value})}
      />
      <div className="flex flex-wrap items-end gap-3">
        <Field
          label="Right option (number)"
          type="number"
          min={1}
          max={6}
          value={q.answer}
          onChange={(e) => setQ({...q, answer: e.target.value})}
        />
        <label className="grid gap-1 text-sm">
          Skill
          <select value={q.skill} onChange={(e) => setQ({...q, skill: e.target.value})} className={selectCls}>
            <option value="theoretical">Theoretical</option>
            <option value="practical">Practical</option>
          </select>
        </label>
        <label className="flex items-center gap-2 pb-3 text-sm">
          <input
            type="checkbox"
            className="size-4"
            checked={q.active}
            onChange={(e) => setQ({...q, active: e.target.checked})}
          />{' '}
          In the bank
        </label>
        <Button type="submit" variant="outline" icon={null}>
          {label}
        </Button>
      </div>
      {note && <p className="text-sm">{note}</p>}
    </form>
  );
}

function Questions({track}) {
  const list = useApi(`/learning/staff/courses/questions?track=${track}`);
  return (
    <div className="space-y-4">
      <QuestionForm track={track} onSaved={list.reload} label="Add question" />
      {list.data?.map((q) => (
        <details key={q._id} className="rounded-[18px] border border-rule px-5 py-4">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0">{q.question}</span>
            <Tag>{q.active ? 'In the bank' : 'Off'}</Tag>
          </summary>
          <div className="mt-4">
            <QuestionForm track={track} initial={q} onSaved={list.reload} label="Save question" />
          </div>
        </details>
      ))}
    </div>
  );
}

const blankPractice = () => ({question: '', options: '', answer: 1, explain: ''});

function LessonForm({track, initial, onSaved, nextOrder}) {
  const [l, setL] = useState(
    initial
      ? {
          ...initial,
          practice: initial.practice.map((p) => ({...p, options: p.options.join('\n'), answer: p.answer + 1})),
        }
      : {order: nextOrder, title: '', body: '', practice: [], published: false},
  );
  const [note, setNote] = useState('');
  const setP = (i, k) => (e) =>
    setL((x) => ({...x, practice: x.practice.map((p, j) => (j === i ? {...p, [k]: e.target.value} : p))}));
  const submit = async (e) => {
    e.preventDefault();
    const body = {
      track,
      order: Number(l.order),
      title: l.title,
      body: l.body,
      published: l.published,
      practice: l.practice.map((p) => ({
        question: p.question,
        options: lines(p.options),
        answer: Number(p.answer) - 1,
        explain: p.explain,
      })),
    };
    const path = initial ? `/learning/staff/courses/lessons/${initial._id}` : '/learning/staff/courses/lessons';
    if (await save(() => api(path, {method: initial ? 'PUT' : 'POST', body}), setNote)) {
      if (!initial) setL({order: Number(l.order) + 1, title: '', body: '', practice: [], published: false});
      onSaved();
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4 rounded-[18px] border border-rule p-5">
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <Field
          label="Order"
          type="number"
          min={1}
          value={l.order}
          onChange={(e) => setL({...l, order: e.target.value})}
        />
        <Field label="Title" required value={l.title} onChange={(e) => setL({...l, title: e.target.value})} />
      </div>
      <TextArea
        label="Lesson (plain text; blank lines make paragraphs)"
        rows={10}
        maxLength={20000}
        value={l.body}
        onChange={(e) => setL({...l, body: e.target.value})}
      />
      {l.practice.map((p, i) => (
        <fieldset key={i} className="space-y-3 rounded-[14px] border border-rule p-4">
          <legend className="px-1 text-sm font-medium">Practice {i + 1}</legend>
          <Field label="Question" required value={p.question} onChange={setP(i, 'question')} />
          <TextArea label="Options, one per line" rows={3} value={p.options} onChange={setP(i, 'options')} />
          <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
            <Field
              label="Right option (number)"
              type="number"
              min={1}
              max={6}
              value={p.answer}
              onChange={setP(i, 'answer')}
            />
            <Field label="Why (shown after answering)" value={p.explain} onChange={setP(i, 'explain')} />
          </div>
          <button
            type="button"
            className="text-sm text-muted underline"
            onClick={() => setL((x) => ({...x, practice: x.practice.filter((_, j) => j !== i)}))}
          >
            Remove this question
          </button>
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          icon={null}
          onClick={() => setL((x) => ({...x, practice: [...x.practice, blankPractice()]}))}
        >
          Add practice question
        </Button>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4"
            checked={l.published}
            onChange={(e) => setL({...l, published: e.target.checked})}
          />{' '}
          Published
        </label>
        <Button type="submit" variant="accent" icon={null}>
          {initial ? 'Save lesson' : 'Add lesson'}
        </Button>
        {note && <p className="text-sm">{note}</p>}
      </div>
    </form>
  );
}

function Lessons({track}) {
  const list = useApi(`/learning/staff/courses/lessons?track=${track}`);
  const next = (list.data?.reduce((m, l) => Math.max(m, l.order), 0) ?? 0) + 1;
  return (
    <div className="space-y-4">
      {list.data?.map((l) => (
        <details key={l._id} className="rounded-[18px] border border-rule px-5 py-4">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0">
              {l.order}. {l.title}
            </span>
            <Tag>{l.published ? 'Published' : 'Draft'}</Tag>
          </summary>
          <div className="mt-4">
            <LessonForm track={track} initial={l} onSaved={list.reload} />
          </div>
        </details>
      ))}
      {list.data && <LessonForm key={next} track={track} onSaved={list.reload} nextOrder={next} />}
    </div>
  );
}

export function Courses() {
  const tracks = useApi('/learning/staff/courses/tracks');
  const [slug, setSlug] = useState('');
  const [tab, setTab] = useState('questions');
  const current = tracks.data?.find((t) => t.slug === slug);
  return (
    <div className="space-y-10">
      {tracks.error && <p className="body">⚠ {tracks.error.message}</p>}
      <ul className="border-t border-rule">
        {tracks.data?.map((t) => (
          <li key={t.slug}>
            <button
              type="button"
              onClick={() => setSlug(t.slug)}
              className={`flex w-full flex-wrap items-center justify-between gap-3 border-b py-4 text-left ${
                slug === t.slug ? 'border-ink' : 'border-rule hover:border-ink'
              }`}
            >
              <span className="min-w-0">
                <span className="block font-medium">{t.name}</span>
                <span className="text-sm text-muted">
                  {t.questions} of {t.bank} questions · {t.minutes} min · pass {t.passPercent}% · {t.lessons} lessons
                  {t.added > 0 && ` · ${t.added} added here`}
                </span>
              </span>
              <Tag>{t.active ? 'Open' : 'Off'}</Tag>
            </button>
          </li>
        ))}
      </ul>
      {current ? (
        <section className="space-y-8">
          <TrackForm key={current.slug} initial={current} onSaved={tracks.reload} />
          <div className="flex gap-2">
            {['questions', 'lessons'].map((t) => (
              <Button key={t} variant={tab === t ? 'accent' : 'outline'} icon={null} onClick={() => setTab(t)}>
                {t === 'questions' ? 'Exam questions' : 'Lessons'}
              </Button>
            ))}
          </div>
          {tab === 'questions' ? <Questions key={slug} track={slug} /> : <Lessons key={slug} track={slug} />}
        </section>
      ) : (
        <section className="space-y-4">
          <p className="font-medium">Open a track above, or make a new one</p>
          <TrackForm initial={NEW_TRACK} onSaved={tracks.reload} />
        </section>
      )}
    </div>
  );
}
