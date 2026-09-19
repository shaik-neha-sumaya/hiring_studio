import { Badge, Card, CardHeader, Note } from '../ui';
import { IconScale } from '../icons';

const LEVEL_LABELS = {
  1: 'Does not meet',
  2: 'Below',
  3: 'Meets',
  4: 'Exceeds',
  5: 'Far exceeds',
};

const WEIGHT_LABEL = { 1: 'Standard weight', 2: 'Important', 3: 'Drives the role' };

export default function RubricView({ dimensions }) {
  const weightTotal = dimensions.reduce((sum, dimension) => sum + dimension.weight, 0);

  return (
    <div className="space-y-4">
      <Note tone="info">
        Level 3 is the definition of fully meeting the requirements of this role, not a polite average. Score what the
        candidate evidenced, write the evidence next to it, and score before you discuss.
      </Note>

      {dimensions.map((dimension) => (
        <Card key={dimension.id}>
          <CardHeader
            title={dimension.name}
            subtitle={dimension.description}
            icon={IconScale}
            action={
              <div className="text-right">
                <Badge tone={dimension.weight >= 3 ? 'accent' : 'neutral'}>{WEIGHT_LABEL[dimension.weight]}</Badge>
                <p className="mt-1.5 text-[11px] text-muted numeric">
                  {Math.round((dimension.weight / weightTotal) * 100)}% of the total
                </p>
              </div>
            }
          />

          <ol className="divide-y divide-line">
            {[1, 2, 3, 4, 5].map((level) => {
              const meets = level === 3;
              return (
                <li key={level} className={`flex gap-4 px-5 py-3.5 ${meets ? 'bg-accent' : ''}`}>
                  <div className="w-24 shrink-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-md text-[12px] font-semibold numeric ${
                          meets ? 'bg-accent text-ink' : 'bg-raised text-ink-2'
                        }`}
                      >
                        {level}
                      </span>
                      {meets ? <span className="text-[10px] font-semibold uppercase tracking-wide text-ink">bar</span> : null}
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted">{LEVEL_LABELS[level]}</p>
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-ink-2">{dimension.levels[String(level)]}</p>
                </li>
              );
            })}
          </ol>
        </Card>
      ))}
    </div>
  );
}
