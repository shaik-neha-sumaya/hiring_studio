import { normalizeKit } from './validation.js';

/**
 * Offline fallback used only when GEMINI_API_KEY is absent, so the project can be
 * cloned and demonstrated before a key is issued. It is template-driven, derived
 * from the same role families the retriever uses, and every response that comes
 * from here is flagged `offline` so the UI can say so plainly.
 */
const FAMILY_PROFILES = {
  'frontend-engineer': {
    craft: [
      ['Frontend Implementation', 'Builds accessible, responsive interfaces that hold up with real content and real data volumes.'],
      ['State & Data Flow', 'Chooses where state lives, and keeps loading, empty and error states first-class.'],
    ],
    technical: [
      'Walk me through how you decided where a piece of state should live in a recent feature — local, lifted, or server-owned.',
      'Describe a page you made measurably faster. Which metric moved, which tool showed you the problem, and what was the result?',
      'How do you make an interactive component usable by keyboard and screen reader? Give a specific example you shipped.',
    ],
    situational: [
      'A release on Friday evening broke the checkout page for around ten percent of users. Walk me through your first hour.',
      'A design hands you a layout that breaks with long customer names and empty states. What do you do before building it?',
    ],
  },
  'backend-engineer': {
    craft: [
      ['API & System Design', 'Designs interfaces and services with explicit contracts, failure modes and versioning.'],
      ['Data Modelling & Reliability', 'Models the domain soundly and reasons about concurrency, retries and idempotency.'],
    ],
    technical: [
      'Take a small domain from our business and model it out loud. Tell me what you would ask before drawing the schema.',
      'How would you add a required column to a large table that is in constant use? Talk me through the intermediate states.',
      'When have retries made an incident worse? What would you put in place to stop that?',
    ],
    situational: [
      'Requests to one endpoint have gone from 200ms to 9s since this morning, with no deploy. What are your first three moves?',
      'You find an endpoint that trusts a client-supplied user id. Describe how you handle it today and this week.',
    ],
  },
  'software-engineer': {
    craft: [
      ['Technical Depth', 'Explains not only how a technology works but when it is the wrong choice.'],
      ['Debugging & Production Judgement', 'Forms hypotheses, narrows the search space and verifies the fix rather than the symptom.'],
    ],
    technical: [
      'Pick the technology you know best and tell me where it stops being the right tool.',
      'Tell me about the hardest bug you have diagnosed. How did you narrow it down, and how did you confirm the fix?',
      'What makes code easy to change? Point at something you refactored and what improved.',
    ],
    situational: [
      'You inherit a service with no tests and a weekly failure. What do you do in your first two weeks?',
      'You are halfway through a two-week estimate and realise it will take four. What happens next?',
    ],
  },
  sales: {
    craft: [
      ['Pipeline Generation', 'Creates and maintains enough qualified pipeline without relying on inbound volume.'],
      ['Qualification & Commercial Judgement', 'Disqualifies early and protects the team from expensive dead deals.'],
    ],
    technical: [
      'Walk me through your last full quarter: quota, attainment, deal size, cycle length, and how much pipeline you sourced yourself.',
      'How do you decide to walk away from a deal? Give me one you disqualified that a less disciplined rep would have chased.',
      'Tell me about a deal you lost. What actually caused it?',
    ],
    situational: [
      'A prospect goes quiet after a strong demo and two positive calls. What do you do over the next ten days?',
      'Your forecast says a committed deal will close this week and the champion has just left the company. What do you tell us?',
    ],
  },
  marketing: {
    craft: [
      ['Channel Execution', 'Runs at least one channel to a measurable outcome on a small budget.'],
      ['Analytics & Attribution', 'Knows what a result actually proves, and what the counterfactual was.'],
    ],
    technical: [
      'Take the channel you know best and walk me through a campaign end to end, including what it cost and what it returned.',
      'Tell me about a campaign that underperformed. How did you work out why?',
      'How do you tell a channel that works from a channel that looks good on last-click attribution?',
    ],
    situational: [
      'You have a small monthly budget and three months to prove a channel. How do you spend it?',
      'Traffic is up 40 percent and enquiries are flat. What do you look at first?',
    ],
  },
  'customer-support': {
    craft: [
      ['Customer Communication', 'Holds a clear, calm line with frustrated customers without over-promising.'],
      ['Process & Escalation Judgement', 'Knows what to resolve, what to escalate, and documents what recurs.'],
    ],
    technical: [
      'Tell me about a conversation with an angry customer where the customer was wrong. How did you handle it?',
      'Tell me about one where we were wrong. What did you say?',
      'Describe a recurring issue you documented or automated away.',
    ],
    situational: [
      'Three urgent tickets land at once and one is from your largest customer. How do you sequence them, and what do you tell the other two?',
      'A customer asks for something our product cannot do and a competitor can. What do you say?',
    ],
  },
  all: {
    craft: [
      ['Role Craft', 'Demonstrates the core functional skills the role depends on, at the stated level.'],
      ['Quality of Work', 'Produces work that holds up without rework and can be handed over to someone else.'],
    ],
    technical: [
      'Walk me through the piece of work you are most proud of. What was your specific part of it?',
      'Which part of this role do you already do well, and which part would be new to you?',
      'Tell me about something you taught yourself because the job needed it.',
    ],
    situational: [
      'Your first month here, nobody has time to give you daily direction. How do you decide what to work on?',
      'You are asked to do something outside your job description in a busy week. What do you do?',
    ],
  },
};

const SHARED_DIMENSIONS = [
  ['Problem Solving & Judgement', 'Breaks ambiguous problems down, names trade-offs, and decides with incomplete information.'],
  ['Communication', 'Explains decisions to people without their background and checks that they landed.'],
  ['Ownership & Reliability', 'Takes work to a finished state, reports slippage early, and follows through without chasing.'],
  ['Collaboration & Feedback', 'Works well across roles, takes correction without friction, and improves others’ work.'],
];

const BEHAVIORAL = [
  ['Tell me about a time you owned a piece of work that went wrong. How did you find out, and what did you do?', 'Ownership and self-awareness under failure.'],
  ['Describe a time you disagreed with a decision and had to deliver it anyway. How did you handle that?', 'Disagree-and-commit behaviour.'],
  ['Tell me about the last time you had to learn something quickly to finish a job. How did you go about it?', 'Learning rate and resourcefulness.'],
];

const CULTURAL = [
  ['We are a small team, so people regularly work outside their job title. Tell me about a time you did that — and whether you enjoyed it.', 'Breadth tolerance in a small company.'],
  ['How do you prefer to receive feedback, and tell me about the last piece of critical feedback you acted on?', 'Coachability and feedback handling.'],
];

const LEVEL_SUFFIX = {
  1: 'Cannot show evidence of this in their own work; would need this covered by someone else.',
  2: 'Shows partial evidence in simpler situations; would need regular support to meet the role’s needs here.',
  3: 'Meets the role’s needs: gives a specific, complete example and handles the ordinary cases independently.',
  4: 'Exceeds the role’s needs: handles the difficult cases, anticipates second-order effects, and improves how it is done.',
  5: 'Sets the standard: could define how this is done here and raise others to that level.',
};

const levelsFor = (name) =>
  Object.fromEntries(
    Object.entries(LEVEL_SUFFIX).map(([level, text]) => [level, `${name}: ${text}`]),
  );

const toQuestion = (question, purpose, dimensions) => ({
  question,
  purpose,
  guidance:
    'Ask for one specific example rather than a general approach. If the answer is missing the situation, their own task, the actions they personally took, or the result, probe for the missing part before scoring.',
  whatToLookFor: [
    'A specific, recent, first-hand example with names, numbers or dates',
    'Their own contribution separated clearly from the team’s',
    'An honest account of what did not work and what they changed',
  ],
  dimensions,
});

export function buildOfflineKit(roleInput, retrieval) {
  const profile = FAMILY_PROFILES[retrieval.roleFamily] ?? FAMILY_PROFILES.all;
  const seniority = roleInput.seniority || 'Mid-level';
  // "Senior Senior React Developer" reads as a template artefact, so the
  // seniority is only prefixed when the title does not already carry it.
  const [seniorityWord] = seniority.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const rolePhrase = roleInput.roleTitle.toLowerCase().includes(seniorityWord)
    ? roleInput.roleTitle
    : `${seniority.toLowerCase()} ${roleInput.roleTitle}`;
  const craft = profile.craft;
  const dimensionPairs = [...craft, ...SHARED_DIMENSIONS].slice(0, 6);
  const craftNames = craft.map(([name]) => name);

  const keyResponsibilities = [
    `Own ${roleInput.roleTitle.toLowerCase()} delivery end to end, from problem definition to a finished, handed-over result.`,
    `Work directly with ${roleInput.department || 'the rest of the team'} to agree priorities and report progress without being chased.`,
    'Document what you do so the next person can pick it up, and improve the process where it is clearly broken.',
    'Raise risks, blockers and slippage early rather than at the deadline.',
    `Apply ${roleInput.mustHaveSkills || 'the core skills of the role'} to the problems this business actually has.`,
    'Take part in structured interviews and reviews as the team grows.',
    'Handle work outside the job title when a small team needs it, without losing the core remit.',
  ];

  const raw = {
    jobDescription: {
      roleTitle: roleInput.roleTitle,
      roleSummary: `${roleInput.companyName || 'We'} are hiring a ${rolePhrase}${roleInput.department ? ` in our ${roleInput.department} team` : ''}. ${roleInput.responsibilitiesHint || `The role owns the day-to-day delivery of ${roleInput.roleTitle.toLowerCase()} work.`} This is a small-team role, so the person will own outcomes end to end rather than a narrow slice.`,
      keyResponsibilities,
      requiredSkills: (roleInput.mustHaveSkills || 'Core role skills')
        .split(/[,;\n]/)
        .map((skill) => skill.trim())
        .filter(Boolean)
        .slice(0, 6)
        .map((skill) => ({
          skill,
          proficiency: seniority.toLowerCase().includes('senior') ? 'Expert' : 'Strong',
          why: 'Named by the hiring manager as central to the role.',
        })),
      niceToHaveSkills: [
        { skill: 'Experience in a company of a similar size', why: 'Shortens the ramp in a small team.' },
        { skill: `Exposure to ${roleInput.industry || 'this industry'}`, why: 'Less context to build from scratch.' },
      ],
      compensationGuidance:
        roleInput.compensationNotes ||
        'Set the band from two or three current local listings for the same title and seniority, then decide what moves a candidate within it — usually independence, breadth and evidence of owning outcomes rather than years served. Publish the range; it increases qualified applications and avoids a mismatch at offer stage.',
      whyJoinUs:
        roleInput.cultureNotes ||
        `Small team, direct ownership, and visible impact — ${roleInput.companyName || 'the company'} can offer scope and autonomy rather than a structured career ladder.`,
      whatWeLookFor: `Evidence of doing this work first-hand at ${seniority} scope, self-direction when nobody is assigning tasks, and comfort with a role that is broader than its title.`,
    },
    interviewQuestions: {
      technical: profile.technical.map((question, index) =>
        toQuestion(question, 'Tests the craft core of the role.', [craftNames[index % craftNames.length]]),
      ),
      behavioral: BEHAVIORAL.map(([question, purpose], index) =>
        toQuestion(question, purpose, [SHARED_DIMENSIONS[index % SHARED_DIMENSIONS.length][0]]),
      ),
      situational: profile.situational.map((question) =>
        toQuestion(question, 'Tests judgement in a realistic scenario for this role.', ['Problem Solving & Judgement']),
      ),
      culturalFit: CULTURAL.map(([question, purpose]) =>
        toQuestion(question, purpose, ['Collaboration & Feedback']),
      ),
    },
    rubric: {
      dimensions: dimensionPairs.map(([name, description], index) => ({
        name,
        description,
        weight: index < craft.length ? 3 : 2,
        linkedResponsibilities: [keyResponsibilities[index] ?? keyResponsibilities[0]],
        levels: levelsFor(name),
      })),
    },
  };

  return normalizeKit(raw).kit;
}
