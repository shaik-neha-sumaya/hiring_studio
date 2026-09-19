import { Badge, Card, CardHeader, Note, StatTile } from '../ui';
import { IconBook, IconCheck } from '../icons';

const CHANNEL_LABEL = { dense: 'embeddings', lexical: 'keyword' };

export default function ContextView({ retrieval, generation }) {
  return (
    <div className="space-y-4">
      <Note tone="info" title="Why this matters">
        These are the knowledge-base passages that were retrieved and sent to the model with your role notes. The
        competencies, question phrasing and rubric anchors are drawn from them rather than from generic advice.
      </Note>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Chunks retrieved" value={retrieval.chunks.length} caption={`Top ${retrieval.topK} of ${retrieval.candidateCount} candidates ranked`} />
        <StatTile label="Retrieval mode" value={retrieval.mode.split(' ')[0]} tone="accent" caption={retrieval.mode} />
        <StatTile
          label="Role family matched"
          value={retrieval.roleFamily === 'all' ? 'general' : retrieval.roleFamily.replace(/-/g, ' ')}
          caption="Used as a ranking prior, not a filter"
        />
      </div>

      <Card>
        <CardHeader
          title="AI context used"
          icon={IconBook}
          subtitle="Ranked by reciprocal rank fusion across both retrieval channels, capped at two passages per source."
        />

        <ul className="divide-y divide-line">
          {retrieval.chunks.map((chunk) => (
            <li key={chunk.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <IconCheck width={14} height={14} className="text-good" />
                <p className="text-[13.5px] font-medium text-ink">{chunk.title}</p>
                <Badge>{chunk.category}</Badge>
                {chunk.origin === 'upload' ? <Badge tone="accent">your upload</Badge> : null}
                {chunk.injectedForCoverage ? <Badge tone="neutral">added for coverage</Badge> : null}
                <span className="ml-auto text-[11px] text-muted numeric">
                  {chunk.channels.map((channel) => CHANNEL_LABEL[channel] ?? channel).join(' + ')} · score{' '}
                  {chunk.fusedScore}
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{chunk.excerpt}</p>
              <p className="mt-2 text-[11px] text-muted">
                {chunk.source} · passage {chunk.chunkIndex + 1}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Generation detail" subtitle="What the server actually did." />
        <dl className="grid gap-x-6 gap-y-3 px-5 py-4 text-[13px] sm:grid-cols-2">
          <div>
            <dt className="label">Source</dt>
            <dd className="mt-1 text-ink-2">
              {generation.source === 'gemini' ? `Google Gemini (${generation.model})` : 'Local templates (offline demo)'}
            </dd>
          </div>
          <div>
            <dt className="label">Generation attempts</dt>
            <dd className="mt-1 text-ink-2 numeric">
              {generation.attempts || 0}
              {generation.repaired ? ' (one repair pass after validation)' : ''}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="label">Retrieval query sent to the embedder</dt>
            <dd className="mt-1 break-words rounded-lg border border-line bg-inset px-3 py-2 text-[12.5px] leading-relaxed text-ink-2">
              {retrieval.query}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
