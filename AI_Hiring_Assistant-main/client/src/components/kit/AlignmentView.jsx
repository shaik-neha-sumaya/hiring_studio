import { Badge, Card, CardHeader, Note, StatTile } from '../ui';
import { IconLink } from '../icons';

const LINK_TONE = { declared: 'good', inferred: 'neutral', none: 'warning' };
const LINK_LABEL = { declared: 'Direct match', inferred: 'Text match', none: 'Not linked' };

export default function AlignmentView({ alignment, kit }) {
  const { coverage, warnings, score, responsibilities, questionLinks } = alignment;
  const responsibilityText = new Map(responsibilities.map((item) => [item.id, item.text]));
  const questionText = new Map(questionLinks.map((link) => [link.questionId, link.question]));

  const fullyCovered = coverage.filter((entry) => entry.questionCount > 0 && entry.responsibilityIds.length > 0).length;

  return (
    <div className="space-y-4">
      <Note tone={warnings.length ? 'warning' : 'good'} title={warnings.length ? 'Alignment gaps' : 'Aligned'}>
        {warnings.length
          ? 'Review the missing links below.'
          : 'All rubric dimensions are linked to responsibilities and interview questions.'}
        {warnings.length ? (
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
      </Note>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Match score"
          value={`${score}%`}
          tone={score >= 90 ? 'good' : score >= 70 ? 'accent' : 'warning'}
          caption="Connected criteria and questions"
        />
        <StatTile
          label="Criteria fully linked"
          value={`${fullyCovered}/${coverage.length}`}
          caption="Job details and questions linked"
        />
        <StatTile
          label="Questions mapped"
          value={`${questionLinks.filter((link) => link.linkType !== 'none').length}/${questionLinks.length}`}
          caption="Questions linked to criteria"
        />
      </div>

      <Card>
        <CardHeader
          title="How it connects"
          icon={IconLink}
          subtitle="See how job details connect to interview questions."
        />

        <div className="divide-y divide-line">
          {coverage.map((entry) => (
            <div key={entry.dimensionId} className="px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[14px] font-semibold text-ink">{entry.name}</p>
                <div className="flex items-center gap-1.5">
                  <Badge tone={entry.questionCount ? 'good' : 'warning'}>
                    {entry.questionCount} question{entry.questionCount === 1 ? '' : 's'}
                  </Badge>
                  <Badge tone={LINK_TONE[entry.responsibilityLinkType]}>{LINK_LABEL[entry.responsibilityLinkType]}</Badge>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="label">From the job description</p>
                  {entry.responsibilityIds.length ? (
                    <ul className="mt-1.5 space-y-1.5">
                      {entry.responsibilityIds.map((id) => (
                        <li key={id} className="text-[13px] leading-relaxed text-ink-2">
                          {responsibilityText.get(id)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1.5 text-[13px] text-muted">
                      No linked responsibility.
                    </p>
                  )}
                </div>

                <div>
                  <p className="label">Tested by</p>
                  {entry.questionIds.length ? (
                    <ul className="mt-1.5 space-y-1.5">
                      {entry.questionIds.map((id) => (
                        <li key={id} className="text-[13px] leading-relaxed text-ink-2">
                          {questionText.get(id)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1.5 text-[13px] text-muted">
                      No linked interview question.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Rubric weighting"
          subtitle={`${kit.rubric.dimensions.length} criteria weighted by role priority.`}
        />
        <div className="space-y-3 px-5 py-4">
          {kit.rubric.dimensions.map((dimension) => {
            const share = (dimension.weight / kit.rubric.dimensions.reduce((sum, d) => sum + d.weight, 0)) * 100;
            return (
              <div key={dimension.id}>
                <div className="flex items-baseline justify-between text-[13px]">
                  <span className="text-ink-2">{dimension.name}</span>
                  <span className="text-muted numeric">{Math.round(share)}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-inset">
                  <div className="h-full rounded-r bg-series-1" style={{ width: `${share}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
