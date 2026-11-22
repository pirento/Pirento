// Intern → Learn: each track's lessons in order, read one, answer its practice questions. A lesson counts as done
// once every practice answer is right; the right answer and why are shown after each check.
import {useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {Check} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Tag} from '../../components/ui/Tag';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {VideoPlayer} from './Video';

function Lesson({id, done, onDone, onBack}) {
  const lesson = useApi(`/learning/lessons/${id}`);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const check = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const r = await api(`/learning/lessons/${id}/check`, {
        method: 'POST',
        body: {answers: lesson.data.practice.map((_, i) => answers[i] ?? -1)},
      });
      setResult(r);
      if (r.done) onDone();
    } catch (err) {
      setError(err.message);
    }
  };
  if (lesson.error) return <p className="body">⚠ {lesson.error.message}</p>;
  if (!lesson.data) return null;
  const l = lesson.data;
  return (
    <article className="max-w-3xl space-y-8" data-reveal>
      <button type="button" onClick={onBack} className="text-sm text-muted underline underline-offset-4">
        ← All lessons
      </button>
      <header>
        <p className="eyebrow">Lesson {l.order}</p>
        <h2 className="mt-3 text-3xl">{l.title}</h2>
        {done && (
          <p className="mt-3">
            <Tag tone="accent">Done</Tag>
          </p>
        )}
      </header>
      {l.hasVideo && <VideoPlayer path={`/learning/lesson-video/${l._id}`} />}
      <div className="body space-y-4 whitespace-pre-line">{l.body}</div>
      {l.practice.length > 0 && (
        <form onSubmit={check} className="space-y-6 rounded-[22px] border border-rule p-6">
          <p className="eyebrow">Practice</p>
          {l.practice.map((q, i) => (
            <fieldset key={i} className="space-y-2">
              <legend className="font-medium">
                {i + 1}. {q.question}
              </legend>
              {q.options.map((o, j) => (
                <label key={j} className="flex items-start gap-3 text-sm">
                  <input
                    type="radio"
                    name={`q${i}`}
                    className="mt-1 size-4 shrink-0"
                    checked={answers[i] === j}
                    onChange={() => setAnswers((a) => Object.assign([...a], {[i]: j}))}
                  />
                  {o}
                </label>
              ))}
              {result && (
                <p className="text-sm" role="status">
                  {result.results[i].correct ? '✓ Right.' : `✗ The answer is “${q.options[result.results[i].answer]}”.`}{' '}
                  <span className="text-muted">{result.results[i].explain}</span>
                </p>
              )}
            </fieldset>
          ))}
          {error && (
            <p role="alert" className="text-sm">
              ⚠ {error}
            </p>
          )}
          <Button type="submit" variant="accent" icon={null}>
            {result ? 'Check again' : 'Check my answers'}
          </Button>
          {result?.done && <p className="text-sm">All right. This lesson is done.</p>}
        </form>
      )}
    </article>
  );
}

export function Learn({tracks}) {
  const lessons = useApi('/learning/lessons');
  const progress = useApi('/learning/lessons/progress');
  // ?lesson=<id> opens one directly: a review's "watch this lesson" link lands here.
  const [params] = useSearchParams();
  const [openId, setOpenId] = useState(params.get('lesson'));
  const done = new Set(progress.data?.map((p) => p.lessonId));

  if (openId) {
    return <Lesson id={openId} done={done.has(openId)} onDone={progress.reload} onBack={() => setOpenId(null)} />;
  }
  if (lessons.data?.length === 0)
    return <p className="text-muted">Lessons are on their way. Take an exam meanwhile.</p>;
  const byTrack = (tracks ?? []).map((t) => ({...t, lessons: lessons.data?.filter((l) => l.track === t.slug) ?? []}));
  return (
    <div className="space-y-10">
      {byTrack
        .filter((t) => t.lessons.length)
        .map((t) => {
          const finished = t.lessons.filter((l) => done.has(l._id)).length;
          return (
            <section key={t.slug} data-reveal>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-2xl">{t.name}</h3>
                <span className="text-sm text-muted tabular-nums">
                  {finished} of {t.lessons.length} done
                </span>
              </div>
              <ul className="mt-4 border-t border-rule">
                {t.lessons.map((l) => (
                  <li key={l._id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(l._id)}
                      className="flex w-full items-center gap-4 border-b border-rule py-4 text-left hover:border-ink"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-rule text-sm tabular-nums">
                        {done.has(l._id) ? <Check aria-label="Done" className="size-4" /> : l.order}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium">{l.title}</span>
                        <span className="text-sm text-muted">
                          {l.practice} practice question{l.practice === 1 ? '' : 's'}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
    </div>
  );
}
