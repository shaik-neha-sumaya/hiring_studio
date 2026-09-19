import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Badge, Button, Card, CardHeader, Field, Note, Spinner, Textarea } from '../components/ui';
import { IconArrowLeft, IconCheck, IconScale } from '../components/icons';
import Scorecard from '../components/Scorecard';

const categories = ['technical', 'behavioral', 'situational', 'culturalFit'];

export default function InterviewPage() {
  const { candidateId, jobId } = useParams();
  const { notify } = useToast();
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [dimensionScores, setDimensionScores] = useState({});
  const [redFlags, setRedFlags] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getInterview(candidateId).then((payload) => {
      setData(payload);
      const stored = payload.interview;
      setAnswers(Object.fromEntries((stored?.answers ?? []).map((answer) => [answer.questionId, answer])));
      setDimensionScores(stored?.dimensionScores ?? {});
      setRedFlags((stored?.redFlags ?? []).join('\n'));
      setAdditionalNotes(stored?.additionalNotes ?? '');
    }).catch((requestError) => setError(requestError.message));
  }, [candidateId]);

  const questions = useMemo(
    () => categories.flatMap((category) => (data?.role.kit.interviewQuestions[category] ?? []).map((question) => ({ ...question, category }))),
    [data],
  );

  function updateAnswer(questionId, patch) {
    setAnswers((current) => ({ ...current, [questionId]: { ...current[questionId], questionId, ...patch } }));
  }

  function payload() {
    return {
      answers: questions.map((question) => answers[question.id] ?? { questionId: question.id, answer: '', score: null, interviewerNotes: '' }),
      dimensionScores,
      redFlags: redFlags.split('\n').map((item) => item.trim()).filter(Boolean),
      additionalNotes,
    };
  }

  async function save(submit = false) {
    setError('');
    setBusy(true);
    try {
      await (submit ? api.submitInterview(candidateId, payload()) : api.saveInterview(candidateId, payload()));
      notify(submit ? 'Interview submitted and score calculated.' : 'Interview progress saved.', 'success');
      if (submit) setData((current) => ({ ...current, interview: { ...current.interview, status: 'completed' } }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <Note tone="critical">{error}</Note>;
  if (!data) return <div className="skeleton h-96" />;

  const completed = questions.filter((question) => answers[question.id]?.score).length;
  const dimensions = data.role.kit.rubric.dimensions;

  return (
    <div className="space-y-5">
      <Link to={`/jobs/${jobId}/candidates`} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink-2">
        <IconArrowLeft width={15} height={15} /> Candidates
      </Link>
      <header>
        <h1 className="text-[24px] font-semibold tracking-tight">Interview: {data.candidate.name}</h1>
        <p className="mt-1 text-[13.5px] text-ink-2">{data.role.roleTitle} · {completed} / {questions.length} questions scored</p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader title="Interview questions" icon={IconCheck} subtitle="Use the same questions and scoring anchors for every candidate." />
          <div className="divide-y divide-line">
            {questions.map((question, index) => {
              const answer = answers[question.id] ?? {};
              return (
                <div key={question.id} className="space-y-3 px-5 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-semibold text-ink">{index + 1}. {question.question}</p>
                      <Badge className="mt-2">{question.category}</Badge>
                    </div>
                    <span className="text-[12px] text-muted">Score</span>
                  </div>
                  <p className="rounded-lg border border-line bg-inset px-3.5 py-3 text-[12.5px] leading-relaxed text-ink-2">{question.guidance}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Answer / notes">
                      <Textarea rows={4} value={answer.answer ?? ''} onChange={(event) => updateAnswer(question.id, { answer: event.target.value })} />
                    </Field>
                    <Field label="Interviewer notes">
                      <Textarea rows={4} value={answer.interviewerNotes ?? ''} onChange={(event) => updateAnswer(question.id, { interviewerNotes: event.target.value })} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button key={score} type="button" onClick={() => updateAnswer(question.id, { score })} className={`rounded-lg border px-2 py-2 text-center text-sm font-semibold ${answer.score === score ? 'border-accent bg-accent text-ink' : 'border-line bg-inset text-ink-2'}`} aria-label={`Score ${score}`}>{score}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <aside className="space-y-5">
          <Card>
            <CardHeader title="Rubric score" icon={IconScale} subtitle="These scores determine the final weighted result." />
            <Scorecard dimensions={dimensions} scores={dimensionScores} onChange={setDimensionScores} />
          </Card>
          <Card className="p-5">
            <Field label="Red flags / concerns" hint="Record potential concerns to review, not an automatic rejection decision.">
              <Textarea rows={4} value={redFlags} onChange={(event) => setRedFlags(event.target.value)} placeholder="One concern per line" />
            </Field>
            <Field label="Additional notes">
              <Textarea rows={4} value={additionalNotes} onChange={(event) => setAdditionalNotes(event.target.value)} />
            </Field>
            {error ? <Note tone="critical">{error}</Note> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => save(false)} disabled={busy}>{busy ? <Spinner /> : null}Save progress</Button>
              <Button onClick={() => window.confirm('Submit this interview evaluation?') && save(true)} disabled={busy}>Submit interview</Button>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}