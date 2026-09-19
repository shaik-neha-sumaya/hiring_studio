import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Badge, Button, Note, Tabs } from '../components/ui';
import { IconArrowLeft, IconUsers } from '../components/icons';
import JobDescriptionView from '../components/kit/JobDescriptionView';
import QuestionsView from '../components/kit/QuestionsView';
import RubricView from '../components/kit/RubricView';
import AlignmentView from '../components/kit/AlignmentView';

export default function RolePage() {
  const params = useParams();
  const roleId = params.roleId ?? params.jobId;
  const { notify } = useToast();
  const [role, setRole] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('description');

  useEffect(() => {
    api
      .getRole(roleId)
      .then(({ role: loaded }) => setRole(loaded))
      .catch((requestError) => setError(requestError.message));
  }, [roleId]);

  if (error) return <Note tone="critical">{error}</Note>;

  if (!role) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-24" />
        <div className="skeleton h-72" />
      </div>
    );
  }

  const { kit, alignment, generation, roleInput } = role;
  const questionCount = Object.values(kit.interviewQuestions).flat().length;

  const tabs = [
    { id: 'description', label: 'Job description' },
    { id: 'questions', label: 'Interview questions', count: questionCount },
    { id: 'rubric', label: 'Score guide', count: kit.rubric.dimensions.length },
    { id: 'alignment', label: 'Match check' },
  ];

  async function copyDescription() {
    const { jobDescription } = kit;
    const text = [
      jobDescription.roleTitle,
      '',
      jobDescription.roleSummary,
      '',
      'Key responsibilities',
      ...jobDescription.keyResponsibilities.map((item) => `- ${item}`),
      '',
      'Required skills',
      ...jobDescription.requiredSkills.map((item) =>
        `- ${item.skill}${item.proficiency ? ` (${item.proficiency})` : ''}${item.why ? ` - ${item.why}` : ''}`,
      ),
      '',
      'Nice to have',
      ...jobDescription.niceToHaveSkills.map((item) => `- ${item.skill}`),
      '',
      'Compensation',
      jobDescription.compensationGuidance,
      '',
      'Why join us',
      jobDescription.whyJoinUs,
      '',
      'What we look for',
      jobDescription.whatWeLookFor,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      notify('Job description copied to your clipboard.', 'success');
    } catch {
      notify('Your browser blocked clipboard access.', 'error');
    }
  }

  async function downloadPdf() {
    try {
      const { blob } = await api.downloadRolePdf(roleId);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${kit.jobDescription.roleTitle || roleInput.roleTitle}-job-description.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      notify('Job description PDF downloaded.', 'success');
    } catch (requestError) {
      notify(requestError.message, 'error');
    }
  }

  return (
    <div className="space-y-5">
      <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink-2">
        <IconArrowLeft width={15} height={15} />
        All roles
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[24px] font-semibold tracking-tight">{kit.jobDescription.roleTitle || roleInput.roleTitle}</h1>
          <p className="mt-1 text-[13px] text-muted">
            {[roleInput.seniority, roleInput.department, roleInput.location, roleInput.companyName]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone={generation.source === 'gemini' ? 'accent' : 'warning'}>
              {generation.source === 'gemini' ? `Gemini ${generation.model}` : 'Offline templates'}
            </Badge>
            {generation.repaired ? <Badge tone="neutral">repaired once</Badge> : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={copyDescription}>
            Copy description
          </Button>
          <Button variant="secondary" onClick={downloadPdf}>
            Download PDF
          </Button>
          <Link to={`/roles/${roleId}/candidates`}>
            <Button>
              <IconUsers width={16} height={16} />
              Score candidates
            </Button>
          </Link>
        </div>
      </header>

      {generation.warnings?.length ? (
        <Note tone="warning" title="Gemini left some gaps in this kit">
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {generation.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </Note>
      ) : null}

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div className="animate-fade-up">
        {tab === 'description' ? <JobDescriptionView jobDescription={kit.jobDescription} /> : null}
        {tab === 'questions' ? <QuestionsView questions={kit.interviewQuestions} alignment={alignment} /> : null}
        {tab === 'rubric' ? <RubricView dimensions={kit.rubric.dimensions} /> : null}
        {tab === 'alignment' ? <AlignmentView alignment={alignment} kit={kit} /> : null}
      </div>
    </div>
  );
}
