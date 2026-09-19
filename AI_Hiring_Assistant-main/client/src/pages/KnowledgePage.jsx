import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  Note,
  Select,
  Spinner,
  StatTile,
  Textarea,
} from '../components/ui';
import { IconBook, IconDoc, IconTrash, IconUpload } from '../components/icons';

const CATEGORIES = ['technical', 'competency', 'behavioral', 'evaluation', 'methodology', 'process', 'general'];

export default function KnowledgePage() {
  const { notify } = useToast();
  const fileInput = useRef(null);

  const [stats, setStats] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState({ title: '', category: 'general', roles: '' });
  const [note, setNote] = useState({ title: '', category: 'competency', roles: '', text: '' });

  const load = useCallback(() => {
    api
      .knowledge()
      .then((payload) => {
        setStats(payload.stats);
        setDocuments(payload.documents);
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(load, [load]);

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', meta.title || file.name);
      formData.append('category', meta.category);
      formData.append('roles', meta.roles);

      const { chunkCount } = await api.uploadKnowledge(formData);
      notify(`Indexed ${file.name} into ${chunkCount} retrievable passages.`, 'success');
      setMeta({ title: '', category: 'general', roles: '' });
      load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function saveNote(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { chunkCount } = await api.addKnowledgeNote(note);
      notify(`Added "${note.title}" as ${chunkCount} passages.`, 'success');
      setNote({ title: '', category: 'competency', roles: '', text: '' });
      load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(document) {
    if (!window.confirm(`Remove "${document.title}" from the knowledge base?`)) return;
    try {
      await api.deleteKnowledge(document.id);
      notify('Document removed.', 'success');
      load();
    } catch (requestError) {
      notify(requestError.message, 'error');
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[24px] font-semibold tracking-tight">Knowledge base</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-ink-2">
          Every hiring kit is generated against passages retrieved from here. The bundled corpus covers competency
          frameworks, STAR interviewing, rubric design and structured-hiring practice. Add your own material to make
          the output specific to how your company hires.
        </p>
      </header>

      {error ? <Note tone="critical">{error}</Note> : null}

      {stats ? (
        <div className="grid gap-3 sm:grid-cols-4">
          <StatTile label="Documents" value={stats.documentCount} />
          <StatTile label="Retrievable passages" value={stats.chunkCount} tone="accent" />
          <StatTile label="Embedded" value={stats.embeddedChunkCount} caption="Gemini embeddings cached on disk" />
          <StatTile
            label="Retrieval mode"
            value={stats.retrievalMode}
            tone={stats.retrievalMode === 'hybrid' ? 'good' : 'warning'}
            caption={
              stats.retrievalMode === 'hybrid'
                ? 'Embeddings and keyword search, fused'
                : 'Keyword only — add an API key for embeddings'
            }
          />
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Upload a document"
            icon={IconUpload}
            subtitle="PDF, TXT, Markdown or JSON. Text is extracted, chunked, embedded and indexed immediately."
          />
          <div className="space-y-4 px-5 py-5">
            <Field label="Title" hint="Shown in the “AI context used” panel. Defaults to the filename.">
              <Input
                value={meta.title}
                onChange={(event) => setMeta({ ...meta, title: event.target.value })}
                placeholder="Our engineering competency ladder"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <Select value={meta.category} onChange={(event) => setMeta({ ...meta, category: event.target.value })}>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Role families" hint="Comma separated. Boosts retrieval for matching roles.">
                <Input
                  value={meta.roles}
                  onChange={(event) => setMeta({ ...meta, roles: event.target.value })}
                  placeholder="software-engineer, sales"
                />
              </Field>
            </div>

            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.txt,.md,.markdown,.json"
              onChange={upload}
              className="hidden"
            />
            <Button variant="secondary" onClick={() => fileInput.current?.click()} disabled={busy} className="w-full">
              {busy ? <Spinner /> : <IconUpload width={16} height={16} />}
              Choose a file
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Or paste a note" icon={IconBook} subtitle="Useful for internal guidance that never made it into a document." />
          <form onSubmit={saveNote} className="space-y-4 px-5 py-5">
            <Field label="Title" required>
              <Input value={note.title} onChange={(event) => setNote({ ...note, title: event.target.value })} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <Select value={note.category} onChange={(event) => setNote({ ...note, category: event.target.value })}>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Role families">
                <Input
                  value={note.roles}
                  onChange={(event) => setNote({ ...note, roles: event.target.value })}
                  placeholder="operations"
                />
              </Field>
            </div>
            <Field label="Content" required hint="At least 200 characters.">
              <Textarea rows={6} value={note.text} onChange={(event) => setNote({ ...note, text: event.target.value })} required />
            </Field>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? <Spinner /> : null}
              Add to knowledge base
            </Button>
          </form>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Indexed sources"
          subtitle={`${stats?.sources.length ?? 0} documents. Bundled material cannot be deleted; your uploads can.`}
        />
        <ul className="divide-y divide-line">
          {stats?.sources.map((source) => {
            const uploaded = documents.find((document) => document.source === source.source);
            return (
              <li key={source.source} className="flex items-center gap-3 px-5 py-3.5">
                <IconDoc width={16} height={16} className="shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-ink">{source.title}</p>
                  <p className="truncate text-[11.5px] text-muted numeric">
                    {source.source} · {source.chunkCount} passages
                  </p>
                </div>
                <Badge tone="accent">{source.category}</Badge>
                <Badge tone="accent">
                  {source.origin === 'upload' ? 'yours' : 'bundled'}
                </Badge>
                {uploaded ? (
                  <button
                    onClick={() => remove(uploaded)}
                    aria-label={`Remove ${source.title}`}
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-critical/10 hover:text-critical"
                  >
                    <IconTrash width={15} height={15} />
                  </button>
                ) : (
                  <span className="w-[34px]" />
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
