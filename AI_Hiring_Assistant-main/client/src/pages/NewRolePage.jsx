import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useHealth } from '../hooks/useHealth';
import { Button, Card, CardHeader, Field, Input, Note, Select, Spinner, Textarea } from '../components/ui';
import { IconCheck, IconSpark } from '../components/icons';

const SENIORITIES = ['Entry level', 'Junior', 'Mid-level', 'Senior', 'Lead', 'Manager'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];

const EXAMPLES = [
  {
    label: 'Senior React developer',
    values: {
      roleTitle: 'Senior React Developer',
      seniority: 'Senior',
      department: 'Product',
      location: 'Remote (UK)',
      industry: 'Food retail',
      companySize: '8 people',
      responsibilitiesHint:
        'Own our customer-facing ordering site. Rebuild the checkout flow, which fails too often on mobile, and set the frontend conventions for the two developers joining next year.',
      mustHaveSkills: 'React, JavaScript, accessibility, performance profiling, working with a designer',
      cultureNotes: 'Eight people, no managers, everyone answers customer emails one morning a week.',
    },
  },
  {
    label: 'Bakery shift supervisor',
    values: {
      roleTitle: 'Shift Supervisor',
      seniority: 'Mid-level',
      department: 'Store operations',
      location: 'Leeds, on-site',
      industry: 'Food retail',
      companySize: '14 people',
      responsibilitiesHint:
        'Run the morning shift for our second bakery: open up, allocate the team, handle customer complaints, keep waste under control and train the two new apprentices.',
      mustHaveSkills: 'Team leadership, food hygiene, stock control, handling difficult customers',
      cultureNotes: 'Family-run, early starts, everyone covers the counter when it is busy.',
    },
  },
  {
    label: 'First sales hire',
    values: {
      roleTitle: 'Account Executive',
      seniority: 'Mid-level',
      department: 'Sales',
      location: 'Hybrid, Manchester',
      industry: 'B2B software',
      companySize: '11 people',
      responsibilitiesHint:
        'Our first sales hire. Build pipeline from scratch, run the whole cycle from first call to close for deals around 15k, and tell us honestly what is and is not working.',
      mustHaveSkills: 'Outbound prospecting, discovery calls, forecasting, CRM discipline',
      cultureNotes: 'Founder-led sales so far. No playbook yet, so the first hire helps write it.',
    },
  },
];

const STAGES = [
  'Loading hiring guidance',
  'Creating the description, questions and score guide',
  'Checking the generated content',
  'Checking that the sections match',
];

function GenerationProgress({ offline }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStage((current) => Math.min(current + 1, STAGES.length - 1)), 2600);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-plane/85 px-5 backdrop-blur-sm">
      <Card className="w-full max-w-md p-7">
        <div className="flex items-center gap-3">
          <Spinner className="h-5 w-5 border-accent border-t-accent" />
          <div>
            <p className="text-[15px] font-semibold">Building your hiring kit</p>
            <p className="text-[12.5px] text-muted">
              {offline ? 'Offline demo mode: templates, no API calls.' : 'This usually takes 10 to 25 seconds.'}
            </p>
          </div>
        </div>

        <ol className="mt-6 space-y-3">
          {STAGES.map((label, index) => {
            const done = index < stage;
            const active = index === stage;
            return (
              <li key={label} className="flex items-center gap-3 text-[13px]">
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                    done
                      ? 'border-good/40 bg-good/15 text-good'
                      : active
                        ? 'border-accent bg-accent text-ink'
                        : 'border-line text-muted'
                  }`}
                >
                  {done ? <IconCheck width={12} height={12} /> : <span className="text-[10px]">{index + 1}</span>}
                </span>
                <span className={done || active ? 'text-ink-2' : 'text-muted'}>{label}</span>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}

export default function NewRolePage() {
  const { user } = useAuth();
  const health = useHealth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    roleTitle: '',
    seniority: 'Mid-level',
    employmentType: 'Full-time',
    location: '',
    department: '',
    companyName: user?.company ?? '',
    companySize: '',
    industry: '',
    responsibilitiesHint: '',
    mustHaveSkills: '',
    cultureNotes: '',
    compensationNotes: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const applyExample = (values) => setForm((current) => ({ ...current, ...values }));

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { role } = await api.createRole(form);
      notify(`Hiring kit ready for ${role.roleInput.roleTitle}.`, 'success');
      navigate(`/roles/${role.id}`);
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  const describedLength = form.responsibilitiesHint.trim().length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {busy ? <GenerationProgress offline={health && !health.ai.configured} /> : null}

      <header>
        <h1 className="text-[24px] font-semibold tracking-tight">Describe the role</h1>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">
          Add the role details below to generate a job description, interview questions, and evaluation rubric.
        </p>
      </header>

      {health && !health.ai.configured ? (
        <Note tone="warning" title="No Gemini API key configured">
          Kits will be assembled from local templates and labelled offline. Add a free key to{' '}
          <code className="rounded bg-inset px-1 py-0.5 text-[12px]">server/.env</code> and restart the server for real
          generation.
        </Note>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="label">Start from an example</span>
        {EXAMPLES.map((example) => (
          <button
            key={example.label}
            type="button"
            onClick={() => applyExample(example.values)}
            className="rounded-full border border-line bg-raised px-3 py-1.5 text-[12.5px] text-ink-2 transition-colors hover:border-edge hover:text-ink"
          >
            {example.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Card>
          <CardHeader title="The role" icon={IconSpark} subtitle="Only the title and the description are required." />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Role title" required>
                <Input
                  value={form.roleTitle}
                  onChange={update('roleTitle')}
                  placeholder="Senior React Developer"
                  required
                />
              </Field>
            </div>

            <Field label="Seniority">
              <Select value={form.seniority} onChange={update('seniority')}>
                {SENIORITIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Employment type">
              <Select value={form.employmentType} onChange={update('employmentType')}>
                {EMPLOYMENT_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Team or department">
              <Input value={form.department} onChange={update('department')} placeholder="Product" />
            </Field>

            <Field label="Location / arrangement">
              <Input value={form.location} onChange={update('location')} placeholder="Remote (UK)" />
            </Field>

            <div className="sm:col-span-2">
              <Field
                label="What will this person actually do?"
                required
                hint={`${describedLength} characters, 20 minimum. Name the real problems, not the duties.`}
              >
                <Textarea
                  rows={5}
                  value={form.responsibilitiesHint}
                  onChange={update('responsibilitiesHint')}
                  placeholder="Own our customer-facing ordering site. Rebuild the checkout flow, which fails too often on mobile, and set the frontend conventions for the developers joining next year."
                  required
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Must-have skills" hint="Comma separated. The score guide will use these.">
                <Input
                  value={form.mustHaveSkills}
                  onChange={update('mustHaveSkills')}
                  placeholder="React, JavaScript, accessibility, performance profiling"
                />
              </Field>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Your company"
            subtitle="Used for the Why join us section, and to calibrate the rubric to a small team."
          />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Company name">
              <Input value={form.companyName} onChange={update('companyName')} />
            </Field>
            <Field label="Company size">
              <Input value={form.companySize} onChange={update('companySize')} placeholder="8 people" />
            </Field>
            <Field label="Industry">
              <Input value={form.industry} onChange={update('industry')} placeholder="Food retail" />
            </Field>
            <Field label="Compensation basis" hint="Optional. No figures will be invented.">
              <Input
                value={form.compensationNotes}
                onChange={update('compensationNotes')}
                placeholder="45-55k plus 5% bonus"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field
                label="Culture notes"
                hint="Be honest about the unglamorous parts. It filters better than superlatives."
              >
                <Textarea
                  rows={3}
                  value={form.cultureNotes}
                  onChange={update('cultureNotes')}
                  placeholder="Eight people, no managers, everyone answers customer emails one morning a week."
                />
              </Field>
            </div>
          </div>
        </Card>

        {error ? (
          <Note tone="critical" title="Generation failed">
            {error}
          </Note>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate('/')}>
            Cancel
          </Button>
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? <Spinner /> : <IconSpark width={16} height={16} />}
            Generate hiring kit
          </Button>
        </div>
      </form>
    </div>
  );
}
