import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Badge, Button, Card, CardHeader, EmptyState, Note, StatTile } from '../components/ui';
import { IconArrowLeft, IconScale, IconUsers } from '../components/icons';

function scoreTone(score) {
  if (score === null) return 'text-muted';
  if (score >= 80) return 'text-good';
  if (score >= 60) return 'text-accent';
  return 'text-warning';
}

export default function RankingPage() {
  const params = useParams();
  const roleId = params.roleId ?? params.jobId;
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.comparison(roleId).then(setData).catch((requestError) => setError(requestError.message));
  }, [roleId]);

  const ranked = useMemo(
    () => [...(data?.comparison.rows ?? [])].sort((a, b) => {
      if (a.weightedPercentage === null) return 1;
      if (b.weightedPercentage === null) return -1;
      return b.weightedPercentage - a.weightedPercentage;
    }),
    [data],
  );

  if (error) return <Note tone="critical">{error}</Note>;
  if (!data) return <div className="skeleton h-96" />;

  const completed = ranked.filter((candidate) => candidate.complete);
  const pending = ranked.length - completed.length;
  const leader = completed[0];

  return (
    <div className="space-y-5">
      <Link to={`/jobs/${roleId}/candidates`} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink-2">
        <IconArrowLeft width={15} height={15} /> Candidates
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">Candidate ranking</h1>
          <p className="mt-1 text-[13.5px] text-ink-2">{data.roleTitle} · ordered by weighted score.</p>
        </div>
        <Link to={`/jobs/${roleId}/compare`}><Button variant="secondary"><IconScale width={16} height={16} /> Compare details</Button></Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Completed interviews" value={completed.length} caption={`${pending} pending`} tone="accent" />
        <StatTile label="Leading candidate" value={leader?.name ?? '—'} caption={leader ? `${leader.weightedPercentage}% weighted score` : 'Complete interviews to rank'} tone="good" />
        <StatTile label="Ranking rule" value="Score guide" caption="Based on scores and weights" />
      </div>

      {completed.length < 2 ? (
        <Note tone="info" title="Complete at least two interviews">Finish two interviews to create a useful ranking.</Note>
      ) : null}

      <Card>
        <CardHeader title="Performance order" icon={IconScale} subtitle="Equal scores share the same rank. Pending candidates appear below completed interviews." />
        {ranked.length ? (
          <div className="divide-y divide-line">
            {ranked.map((candidate) => (
              <div key={candidate.id} className="grid gap-4 px-5 py-5 md:grid-cols-[64px_minmax(180px,1fr)_180px_140px] md:items-center">
                <div className={`text-[28px] font-semibold numeric ${candidate.rank ? 'text-ink' : 'text-muted'}`}>
                  {candidate.rank ? `#${candidate.rank}` : '—'}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{candidate.name}</p>
                    {candidate.complete ? <Badge tone="good">Completed</Badge> : <Badge tone="warning">Pending</Badge>}
                    {candidate.rank && candidate.rank === 1 ? <Badge tone="accent">Leading</Badge> : null}
                  </div>
                  <p className="mt-1 text-[12px] text-muted">{[candidate.email, candidate.interviewDate].filter(Boolean).join(' · ') || 'No contact details recorded'}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {candidate.strengths?.map((strength) => <Badge key={strength.dimensionId} tone="good">Strong: {strength.name}</Badge>)}
                    {candidate.gaps?.map((gap) => <Badge key={gap.dimensionId} tone="warning">Review: {gap.name}</Badge>)}
                  </div>
                </div>
                <div className="md:text-right">
                  <p className={`text-[26px] font-semibold numeric ${scoreTone(candidate.weightedPercentage)}`}>{candidate.weightedPercentage ?? '—'}<span className="text-[13px]"> / 100</span></p>
                  <p className="text-[12px] text-muted">{candidate.rawTotal}/{candidate.rawMax} raw score</p>
                </div>
                <div className="flex md:justify-end">
                  <Link to={`/jobs/${roleId}/candidates/${candidate.id}/interview`}><Button size="sm" variant="secondary">View evaluation</Button></Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={IconUsers} title="No candidates yet">Add candidates and complete their interviews to build the ranking.</EmptyState>
        )}
      </Card>
    </div>
  );
}