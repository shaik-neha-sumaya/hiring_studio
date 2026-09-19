import { Badge, Card, CardHeader } from '../ui';
import { IconCheck, IconDoc } from '../icons';

const PROFICIENCY_TONE = { Expert: 'accent', Strong: 'good', Working: 'neutral' };

export default function JobDescriptionView({ jobDescription }) {
  const {
    roleSummary,
    keyResponsibilities,
    requiredSkills,
    niceToHaveSkills,
    compensationGuidance,
    whyJoinUs,
    whatWeLookFor,
  } = jobDescription;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader title="Role summary" icon={IconDoc} />
          <p className="px-5 py-4 text-[14px] leading-relaxed text-ink-2">{roleSummary}</p>
        </Card>

        <Card>
          <CardHeader
            title="Key responsibilities"
            subtitle="Written as outcomes, so a candidate can tell what success looks like."
          />
          <ol className="divide-y divide-line">
            {keyResponsibilities.map((responsibility, index) => (
              <li key={responsibility} className="flex gap-3 px-5 py-3.5">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-raised text-[11px] font-semibold text-muted numeric">
                  {index + 1}
                </span>
                <p className="text-[13.5px] leading-relaxed text-ink-2">{responsibility}</p>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <CardHeader title="What we look for" />
          <p className="px-5 py-4 text-[13.5px] leading-relaxed text-ink-2">{whatWeLookFor}</p>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Required skills" />
          <ul className="divide-y divide-line">
            {requiredSkills.map((skill) => (
              <li key={skill.skill} className="px-5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13.5px] font-medium text-ink">{skill.skill}</p>
                  {skill.proficiency ? (
                    <Badge tone={PROFICIENCY_TONE[skill.proficiency] ?? 'neutral'}>{skill.proficiency}</Badge>
                  ) : null}
                </div>
                {skill.why ? <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{skill.why}</p> : null}
              </li>
            ))}
          </ul>
        </Card>

        {niceToHaveSkills.length ? (
          <Card>
            <CardHeader title="Nice to have" subtitle="Kept separate so it does not read as a requirement." />
            <ul className="space-y-2 px-5 py-4">
              {niceToHaveSkills.map((skill) => (
                <li key={skill.skill} className="flex items-start gap-2.5 text-[13px] text-ink-2">
                  <IconCheck width={14} height={14} className="mt-1 shrink-0 text-muted" />
                  <span>
                    {skill.skill}
                    {skill.why ? <span className="text-muted"> — {skill.why}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <Card>
          <CardHeader title="Compensation guidance" />
          <p className="px-5 py-4 text-[13px] leading-relaxed text-ink-2">{compensationGuidance}</p>
        </Card>

        <Card>
          <CardHeader title="Why join us" />
          <p className="px-5 py-4 text-[13px] leading-relaxed text-ink-2">{whyJoinUs}</p>
        </Card>
      </div>
    </div>
  );
}
