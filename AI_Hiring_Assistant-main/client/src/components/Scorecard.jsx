import { Badge, Textarea } from './ui';

const LEVELS = [1, 2, 3, 4, 5];
const LEVEL_HINT = {
  1: 'Does not meet',
  2: 'Below',
  3: 'Meets',
  4: 'Exceeds',
  5: 'Far exceeds',
};

/**
 * One dimension per block: the level descriptions are shown while scoring rather
 * than in a separate document, because a rubric that is not in front of the
 * interviewer does not get used.
 */
export default function Scorecard({ dimensions, scores, onChange }) {
  const update = (dimensionId, patch) =>
    onChange({ ...scores, [dimensionId]: { ...scores[dimensionId], ...patch } });

  return (
    <div className="divide-y divide-line">
      {dimensions.map((dimension) => {
        const entry = scores[dimension.id] ?? {};
        const selected = entry.score ?? null;

        return (
          <div key={dimension.id} className="px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-ink">{dimension.name}</p>
                <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-muted">{dimension.description}</p>
              </div>
              <Badge tone={dimension.weight >= 3 ? 'accent' : 'neutral'}>weight {dimension.weight}</Badge>
            </div>

            <div
              role="radiogroup"
              aria-label={`Score for ${dimension.name}`}
              className="mt-4 grid grid-cols-5 gap-1.5"
            >
              {LEVELS.map((level) => {
                const active = selected === level;
                return (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => update(dimension.id, { score: active ? null : level })}
                    title={dimension.levels[String(level)]}
                    className={`rounded-lg border px-2 py-2.5 text-center transition-colors ${
                      active
                        ? 'border-accent bg-accent text-ink'
                        : 'border-line bg-inset text-ink-2 hover:border-edge hover:bg-raised'
                    }`}
                  >
                    <span className="block text-[15px] font-semibold numeric">{level}</span>
                    <span className={`mt-0.5 block text-[10px] ${active ? 'text-white/85' : 'text-muted'}`}>
                      {LEVEL_HINT[level]}
                    </span>
                  </button>
                );
              })}
            </div>

            <p
              className={`mt-3 rounded-lg border px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                selected ? 'border-accent bg-accent text-ink' : 'border-line bg-inset text-muted'
              }`}
            >
              {selected
                ? dimension.levels[String(selected)]
                : 'Pick a level to see what it means. Hover a number to read its description first.'}
            </p>

            <div className="mt-3">
              <Textarea
                rows={2}
                value={entry.evidence ?? ''}
                onChange={(event) => update(dimension.id, { evidence: event.target.value })}
                placeholder="Evidence: what did they say or show that justifies this score?"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
