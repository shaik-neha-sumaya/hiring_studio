import { useState } from 'react';
import { Badge, Card, CardHeader, Note } from '../ui';
import { IconCheck, IconLink, IconTarget } from '../icons';

const CATEGORY_META = {
  technical: { label: 'Technical / role-specific', note: 'Tests the craft core of the job.' },
  behavioral: { label: 'Behavioural (STAR)', note: 'Asks what they actually did, then probes for the missing parts.' },
  situational: { label: 'Situational', note: 'A realistic scenario from this role and company size.' },
  culturalFit: { label: 'Collaboration & fit', note: 'How they work with others, not whether you would have a drink with them.' },
};

function QuestionCard({ question, index, linkedDimensions }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="px-5 py-4">
      <div className="flex gap-3">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-raised text-[11px] font-semibold text-muted numeric">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium leading-relaxed text-ink">{question.question}</p>
          {question.purpose ? <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{question.purpose}</p> : null}

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {linkedDimensions.map((name) => (
              <Badge key={name} tone="accent">
                <IconTarget width={11} height={11} />
                {name}
              </Badge>
            ))}
            {linkedDimensions.length === 0 ? <Badge tone="warning">No rubric dimension</Badge> : null}
            <button
              onClick={() => setOpen((current) => !current)}
              className="ml-auto text-[12.5px] font-medium text-accent hover:underline"
            >
              {open ? 'Hide guidance' : 'Interviewer guidance'}
            </button>
          </div>

          {open ? (
            <div className="mt-3 space-y-3 rounded-lg border border-line bg-inset px-4 py-3.5 animate-fade-up">
              {question.guidance ? (
                <div>
                  <p className="label">How to ask it</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{question.guidance}</p>
                </div>
              ) : null}

              {question.whatToLookFor.length ? (
                <div>
                  <p className="label">What a strong answer contains</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {question.whatToLookFor.map((signal) => (
                      <li key={signal} className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-2">
                        <IconCheck width={13} height={13} className="mt-1 shrink-0 text-good" />
                        {signal}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default function QuestionsView({ questions, alignment }) {
  const dimensionNames = new Map(alignment.coverage.map((entry) => [entry.dimensionId, entry.name]));
  const linksByQuestion = new Map(
    alignment.questionLinks.map((link) => [
      link.questionId,
      link.dimensionIds.map((id) => dimensionNames.get(id)).filter(Boolean),
    ]),
  );

  return (
    <div className="space-y-4">
      <Note tone="info">
        Ask every candidate the same questions in the same order. Score each dimension immediately afterwards, in
        writing, before discussing the candidate with anyone else.
      </Note>

      {Object.entries(CATEGORY_META).map(([category, meta]) => {
        const list = questions[category] ?? [];
        if (!list.length) return null;

        return (
          <Card key={category}>
            <CardHeader
              title={meta.label}
              subtitle={meta.note}
              icon={IconLink}
              action={<Badge>{list.length}</Badge>}
            />
            <ul className="divide-y divide-line">
              {list.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  linkedDimensions={linksByQuestion.get(question.id) ?? []}
                />
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
