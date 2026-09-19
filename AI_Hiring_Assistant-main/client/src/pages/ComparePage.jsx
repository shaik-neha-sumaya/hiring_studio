import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Badge, Card, CardHeader, EmptyState, Note, StatTile } from '../components/ui';
import { IconArrowLeft, IconScale, IconUsers } from '../components/icons';
import ComparisonRadar, { SERIES_COLORS } from '../components/ComparisonRadar';

const MAX_OVERLAID = SERIES_COLORS.length;

const CONFIDENCE_TONE = { clear: 'good', moderate: 'info', 'too-close': 'warning', insufficient: 'info' };
const CONFIDENCE_LABEL = {
  clear: 'Clear leader',
  moderate: 'Moderate gap',
  'too-close': 'Too close to call',
  insufficient: 'Not enough data',
};

/** Per-dimension bars: 2px gaps between adjacent marks, values labelled directly. */
function DimensionBars({ dimension, candidates, stat }) {
  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[13.5px] font-medium text-ink">{dimension.name}</p>
        <div className="flex items-center gap-2 text-[11px] text-muted numeric">
          <span>mean {stat?.mean ?? '—'}</span>
          <span>spread {stat?.spread ?? '—'}</span>
          {stat && !stat.differentiating ? <Badge tone="neutral">separated nobody</Badge> : null}
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5">
        {candidates.map((candidate, index) => {
          const score = candidate.scores[dimension.id];
          return (
            <div key={candidate.id} className="flex items-center gap-3">
              <span className="w-24 shrink-0 truncate text-[12px] text-ink-2">{candidate.name}</span>
              <div className="flex h-4 flex-1 items-center gap-[2px]">
                {[1, 2, 3, 4, 5].map((level) => (
                  <span
                    key={level}
                    className="h-full flex-1 rounded-[3px]"
                    style={{ background: score >= level ? SERIES_COLORS[index] : '#22221f' }}
                  />
                ))}
              </div>
              <span className="w-5 shrink-0 text-right text-[12px] font-semibold text-ink numeric">
                {score ?? '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ComparePage() {
  const params = useParams();
  const roleId = params.roleId ?? params.jobId;
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    api
      .comparison(roleId)
      .then((payload) => {
        setData(payload);
        setSelected(payload.comparison.rows.slice(0, MAX_OVERLAID).map((row) => row.id));
      })
      .catch((requestError) => setError(requestError.message));
  }, [roleId]);

  const overlaid = useMemo(
    () => data?.comparison.rows.filter((row) => selected.includes(row.id)) ?? [],
    [data, selected],
  );

  if (error) return <Note tone="critical">{error}</Note>;

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-20" />
        <div className="skeleton h-80" />
      </div>
    );
  }

  const { comparison, dimensions, roleTitle } = data;
  const { rows, dimensionStats, confidence, insights, interviewerEffects } = comparison;
  const statsById = new Map(dimensionStats.map((stat) => [stat.dimensionId, stat]));

  function toggle(id) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : current.length >= MAX_OVERLAID
          ? [...current.slice(1), id]
          : [...current, id],
    );
  }

  if (rows.length < 2) {
    return (
      <div className="space-y-5">
        <Link to={`/roles/${roleId}/candidates`} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink-2">
          <IconArrowLeft width={15} height={15} />
          Candidates
        </Link>
        <Card>
          <EmptyState icon={IconUsers} title="Two candidates needed">
            Comparison starts at two scored candidates. Score another interview and come back.
          </EmptyState>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        to={`/roles/${roleId}/candidates`}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink-2"
      >
        <IconArrowLeft width={15} height={15} />
        Candidates
      </Link>

      <header>
        <h1 className="text-[24px] font-semibold tracking-tight">Candidate comparison</h1>
        <p className="mt-1 text-[13.5px] text-ink-2">
          {roleTitle} · {rows.length} candidates scored against {dimensions.length} dimensions. This view ranks and
          explains; the decision stays with you.
        </p>
      </header>

      <Note tone={CONFIDENCE_TONE[confidence.level]} title={CONFIDENCE_LABEL[confidence.level]}>
        {confidence.message}
      </Note>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Leading candidate" value={rows[0].name} tone="accent" caption={`${rows[0].weightedPercentage}% weighted`} />
        <StatTile
          label="Gap to runner-up"
          value={confidence.gap === null ? '—' : `${confidence.gap} pts`}
          caption="Weighted percentage points"
        />
        <StatTile
          label="Dimensions that separated anyone"
          value={`${dimensionStats.filter((stat) => stat.differentiating).length}/${dimensionStats.length}`}
          caption="The rest scored the same across candidates"
        />
      </div>

      {insights.length ? (
        <div className="space-y-2">
          {insights.map((insight) => (
            <Note key={insight.type} tone={insight.severity === 'warning' ? 'warning' : 'info'}>
              {insight.message}
            </Note>
          ))}
        </div>
      ) : null}

      <Card>
        <CardHeader
          title="Scores by dimension"
          icon={IconScale}
          subtitle="Ranked by weighted total. Raw totals are shown alongside, since the weighting is what makes them differ."
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="px-5 py-3 font-semibold text-muted">#</th>
                <th className="px-3 py-3 font-semibold text-muted">Candidate</th>
                {dimensions.map((dimension) => (
                  <th key={dimension.id} className="px-2 py-3 text-center font-semibold text-muted" title={dimension.name}>
                    <span className="block max-w-[92px] truncate">{dimension.name}</span>
                    <span className="text-[10px] font-normal">w{dimension.weight}</span>
                  </th>
                ))}
                <th className="px-3 py-3 text-right font-semibold text-muted">Raw</th>
                <th className="px-5 py-3 text-right font-semibold text-muted">Weighted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row, index) => {
                const seriesIndex = selected.indexOf(row.id);
                return (
                  <tr key={row.id} className={index === 0 ? 'bg-accent' : ''}>
                    <td className="px-5 py-3 text-muted numeric">{row.rank ?? '—'}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => toggle(row.id)}
                        className="flex items-center gap-2 text-left font-medium text-ink hover:text-accent"
                        title="Show or hide on the radar chart"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-sm border border-edge"
                          style={{
                            background: seriesIndex >= 0 ? SERIES_COLORS[seriesIndex] : 'transparent',
                          }}
                        />
                        {row.name}
                      </button>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {[row.interviewer, !row.complete && 'partial'].filter(Boolean).join(' · ')}
                      </p>
                    </td>
                    {dimensions.map((dimension) => {
                      const score = row.scores[dimension.id];
                      const stat = statsById.get(dimension.id);
                      const isBest = score !== undefined && stat?.max === score && stat.differentiating;
                      return (
                        <td key={dimension.id} className="px-2 py-3 text-center">
                          <span
                            className={`inline-grid h-7 w-7 place-items-center rounded-md text-[12.5px] font-semibold numeric ${
                              score === undefined
                                ? 'text-muted'
                                : isBest
                                  ? 'bg-good/15 text-good'
                                  : 'bg-raised text-ink-2'
                            }`}
                          >
                            {score ?? '—'}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-right text-ink-2 numeric">
                      {row.rawTotal}/{row.rawMax}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-ink numeric">
                      {row.weightedPercentage ?? '—'}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Shape comparison"
            subtitle={`Up to ${MAX_OVERLAID} candidates at once. Click a name in the table to swap one in.`}
            action={
              <div className="flex gap-1.5">
                {overlaid.map((row, index) => (
                  <Badge key={row.id}>
                    <span className="h-2 w-2 rounded-sm" style={{ background: SERIES_COLORS[index] }} />
                    {row.name}
                  </Badge>
                ))}
              </div>
            }
          />
          {overlaid.length ? (
            <ComparisonRadar dimensions={dimensions} candidates={overlaid} />
          ) : (
            <EmptyState title="Nobody selected">Pick a candidate in the table to plot them.</EmptyState>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Where the difference is"
            subtitle="Two candidates on the same total can have opposite profiles — this is the part that decides."
          />
          <div className="divide-y divide-line">
            {dimensions.map((dimension) => (
              <DimensionBars
                key={dimension.id}
                dimension={dimension}
                candidates={overlaid}
                stat={statsById.get(dimension.id)}
              />
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Strengths and gaps against this cohort" subtitle="Relative to the other candidates, not to the scale." />
          <ul className="divide-y divide-line">
            {rows.map((row) => (
              <li key={row.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13.5px] font-semibold text-ink">{row.name}</p>
                  <span className="text-[11px] text-muted numeric">
                    #{row.rank} by score · #{row.bordaRank} by dimensions won
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {row.strengths.map((entry) => (
                    <Badge key={entry.dimensionId} tone="good">
                      {entry.name} {entry.score}
                    </Badge>
                  ))}
                  {row.gaps.map((entry) => (
                    <Badge key={entry.dimensionId} tone="warning">
                      {entry.name} {entry.score}
                    </Badge>
                  ))}
                  {!row.strengths.length && !row.gaps.length ? (
                    <span className="text-[12.5px] text-muted">Scored at the cohort average throughout.</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Interviewer calibration" subtitle={interviewerEffects.note} />
          <ul className="divide-y divide-line">
            {interviewerEffects.interviewers.map((entry) => (
              <li key={entry.interviewer} className="flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-ink">{entry.interviewer}</p>
                  <p className="text-[11.5px] text-muted numeric">
                    {entry.candidateCount} candidate{entry.candidateCount === 1 ? '' : 's'} · average {entry.mean}%
                  </p>
                </div>
                <Badge tone={Math.abs(entry.offset) >= 5 ? 'warning' : 'neutral'}>
                  {entry.offset > 0 ? '+' : ''}
                  {entry.offset} vs cohort
                </Badge>
              </li>
            ))}
          </ul>
          {interviewerEffects.comparable ? (
            <div className="border-t border-line px-5 py-3.5">
              <p className="label">Adjusted weighted scores</p>
              <ul className="mt-2 space-y-1.5">
                {rows.map((row) => (
                  <li key={row.id} className="flex items-baseline justify-between text-[13px]">
                    <span className="text-ink-2">{row.name}</span>
                    <span className="text-ink numeric">
                      {row.weightedPercentage}% → {row.adjustedWeightedPercentage}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
