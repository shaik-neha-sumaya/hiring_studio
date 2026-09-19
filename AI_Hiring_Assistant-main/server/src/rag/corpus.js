/**
 * Seed knowledge base. This ships with the project so retrieval is meaningful on
 * a first run, before anyone uploads their own hiring material. Each document is
 * chunked, embedded and indexed at boot by `knowledgeBase.js`.
 *
 * `roles` holds role-family tags used as a retrieval prior — a document tagged
 * for the family a vacancy belongs to is boosted, it is not a hard filter.
 */
export const SEED_DOCUMENTS = [
  {
    source: 'structured-hiring-playbook.md',
    title: 'Structured Hiring Playbook',
    category: 'methodology',
    roles: ['all'],
    text: `Structured hiring means every candidate for a role answers the same core questions and is scored against the same written criteria. Unstructured interviews predict job performance poorly because interviewers drift toward rapport and shared background; structured interviews roughly double predictive validity for the same time invested.

The minimum viable structure is four artefacts agreed before the first interview: a job description that states the outcomes of the role, a fixed question set mapped to those outcomes, a scoring rubric with behavioural anchors for each level, and a decision rule that says how scores combine into a recommendation.

Score immediately after each interview and before discussing the candidate with other interviewers. Group discussion before independent scoring collapses judgements toward whoever speaks first and destroys the independence that makes a panel more accurate than any one interviewer.

Require written evidence next to every score. A score without evidence is an impression, and impressions cannot be audited, compared across candidates, or defended if a hiring decision is challenged.

Never change the rubric mid-process. If the criteria turn out to be wrong, note it, finish the current round on the original criteria, and revise for the next round — otherwise early and late candidates are being measured with different rulers.`,
  },
  {
    source: 'behavioural-interviewing-star.md',
    title: 'Behavioural Interviewing and the STAR Method',
    category: 'behavioral',
    roles: ['all'],
    text: `Behavioural questions ask what a candidate actually did, not what they would hypothetically do. Past behaviour in a comparable situation is the strongest low-cost signal available in an interview. Phrase them as "Tell me about a time when…" or "Walk me through the last time you…".

STAR is the structure used to evaluate the answer: Situation (the context and constraints), Task (what they personally owned), Action (the specific steps they took), Result (what measurably changed, and what they learned). A complete STAR answer contains all four; interviewers should probe for the missing parts rather than accepting a summary.

The most common failure is the collective "we". Probe for the individual contribution: "What was your specific part of that?" and "What would have happened if you had not been there?" Candidates who cannot separate their contribution from the team's are either being modest or overstating involvement, and the follow-up distinguishes the two.

Strong signals: specific timeframes and numbers, named trade-offs, acknowledgement of what went wrong, and a clear account of what they would do differently. Weak signals: generic process description, unwillingness to name a concrete example, credit that flows entirely toward the candidate, and blame that flows entirely away.

Ask about failure directly. "Tell me about a decision you got wrong and how you found out" separates candidates with genuine self-awareness from those with a rehearsed narrative.`,
  },
  {
    source: 'competency-framework-core.md',
    title: 'Core Competency Framework',
    category: 'competency',
    roles: ['all'],
    text: `A competency is an observable, repeatable behaviour that predicts performance in a specific role. Competencies are not personality traits; "conscientious" is a trait, "breaks ambiguous work into sequenced deliverables and reports slippage early" is a competency.

Every role should be evaluated on between five and seven competencies. Fewer than five and the assessment misses whole dimensions of the job; more than seven and interviewers cannot hold them in mind, so scores collapse into a halo of overall impression.

Competencies divide into four families. Craft competencies are the technical or functional core of the job. Judgement competencies cover prioritisation, trade-off reasoning and decision quality under incomplete information. Collaboration competencies cover communication, feedback, conflict and cross-functional work. Growth competencies cover ownership, learning rate and response to correction.

Weight competencies by how much of the role's outcomes they drive, and state the weights before interviewing. A role where 70 percent of the value is craft should not be decided by a communication score.

Seniority changes the competency bar, not the competency list. A junior candidate should demonstrate a competency with support; a mid-level candidate independently; a senior candidate should raise the standard for others and be accountable for outcomes beyond their own work.`,
  },
  {
    source: 'rubric-design-guide.md',
    title: 'Designing Behavioural Scoring Rubrics',
    category: 'evaluation',
    roles: ['all'],
    text: `A rubric level description must describe observable behaviour at that level, not a quality adjective. "Good communication" is unusable because two interviewers will not agree on what it means. "Explains a technical decision to a non-technical stakeholder, names the trade-off, and checks understanding" is usable because it can be observed or not observed.

Anchor the five-point scale around level 3 as the definition of fully meeting the requirements of the role. Level 1 is a clear gap against the role's needs. Level 2 is partial evidence that would require significant support. Level 4 exceeds what the role needs. Level 5 is rare and means the candidate could set the standard for others in this dimension.

Write level 3 first, then work outward. Teams that write level 1 or level 5 first produce rubrics where the middle levels are indistinguishable.

Each adjacent pair of levels must differ by something an interviewer could point at in their notes. If you cannot state what separates level 3 from level 4, the rubric has four usable levels, not five, and scores will cluster.

Score the evidence gathered, not the candidate's potential. Potential is where bias enters most easily, because it is inferred from similarity to people who succeeded before.`,
  },
  {
    source: 'interviewer-bias-controls.md',
    title: 'Bias Controls for Small Hiring Teams',
    category: 'process',
    roles: ['all'],
    text: `Small teams without an HR function are exposed to the same biases as large ones but have fewer checks. A handful of cheap controls remove most of the damage.

Ask the same core questions in the same order for every candidate in a role. Variation in questioning is the single largest source of unfair comparison, and it is entirely under the interviewer's control.

Score each dimension immediately after the interview, in writing, with evidence, before any discussion. Independent scores that are then compared surface genuine disagreement; consensus reached by conversation hides it.

Separate the assessment from the decision. First establish what the evidence says about each competency, then decide whether the profile fits the role and the budget. Mixing the two produces rubric scores that are reverse-engineered from a decision already made.

Watch for the comparison trap: candidates should be scored against the rubric, not against each other. Scoring against the previous candidate makes the result depend on interview order.

Note the interviewer on every scorecard. Systematic leniency and severity differences between interviewers are large, persistent, and correctable once visible — but only if scores are attributed.`,
  },
  {
    source: 'question-quality-standards.md',
    title: 'What Makes an Interview Question Useful',
    category: 'behavioral',
    roles: ['all'],
    text: `A useful interview question is tied to a specific competency, cannot be answered well from a script, and produces answers that differ between strong and weak candidates. If every candidate answers a question the same way, it carries no information and should be replaced.

Avoid questions that mainly test interview practice: "Tell me about yourself", "What is your greatest weakness", "Where do you see yourself in five years". They reward rehearsal and correlate with confidence rather than competence.

Avoid puzzles and trick questions unrelated to the work. They measure exposure to the puzzle, not job performance, and they damage the candidate experience for senior applicants.

Prefer work-sample and situational questions grounded in a real scenario from the role: "Our checkout page started failing for ten percent of users after a release on Friday evening. Walk me through your first hour." Realistic scenarios also let the candidate assess whether they want the job.

Each question should carry an explicit note of what a strong answer contains, so different interviewers score the same answer similarly. Without it, the question is reliable only for the person who wrote it.`,
  },
  {
    source: 'software-engineering-competencies.md',
    title: 'Software Engineering Competencies',
    category: 'technical',
    roles: ['software-engineer', 'frontend-engineer', 'backend-engineer', 'engineering'],
    text: `Technical depth for a software engineer means the ability to explain not just what a technology does but when it is the wrong choice. Probe one area the candidate claims as a strength until the limits of their knowledge are visible; the boundary is more informative than the breadth.

System and API design covers decomposition, interface contracts, statefulness, failure modes, idempotency, versioning and backwards compatibility. Strong candidates state their assumptions, ask about scale and consistency requirements before designing, and name what they would give up. Weak candidates produce a diagram of components with no discussion of trade-offs.

Code quality covers naming, cohesion, error handling, test strategy and the ability to read unfamiliar code. Ask what makes code easy to change rather than what makes it clean; the former has concrete answers.

Debugging and production judgement are distinct from feature work. Ask for a specific hard bug: how they formed hypotheses, how they narrowed the search space, what tooling they used, and how they verified the fix rather than the symptom disappearing.

Collaboration for engineers shows up in code review, estimation honesty, and how they handle disagreement about a technical direction they lost. Ask about a design they argued against and then had to implement.`,
  },
  {
    source: 'frontend-engineering-skills.md',
    title: 'Frontend Engineering Skill Framework',
    category: 'technical',
    roles: ['frontend-engineer', 'software-engineer', 'engineering'],
    text: `Frontend competence extends well past framework syntax. The durable areas are component decomposition and state ownership, rendering and re-render cost, browser and network behaviour, accessibility, and the ability to turn a design into a responsive implementation that survives real content.

For React specifically, senior signals include: knowing which state belongs local, lifted, in a store or on the server; understanding why an effect is usually the wrong place for derived data; reasoning about reconciliation and memoisation cost instead of applying it reflexively; and handling loading, empty, error and partial states as first-class rather than as afterthoughts.

Performance work should be evidence-driven. Ask how they diagnosed a slow page: which metric moved, which tool showed it, what the fix was, and what the measured improvement was. Candidates who answer with generic advice have read about performance rather than done it.

Accessibility is a strong seniority differentiator in frontend roles. Semantic markup, focus management, keyboard paths and screen-reader behaviour are learnable and reveal whether the candidate has shipped to a broad user base.

Senior frontend engineers own the boundary with design and backend: they negotiate API shapes, push back on designs that cannot degrade, and set component conventions others follow.`,
  },
  {
    source: 'backend-data-competencies.md',
    title: 'Backend and Data Competencies',
    category: 'technical',
    roles: ['backend-engineer', 'software-engineer', 'data-analyst', 'engineering'],
    text: `Backend roles centre on data modelling, API contracts, correctness under concurrency, and operational behaviour. Ask the candidate to model a small domain out loud; the questions they ask before drawing the schema separate experience from recall.

Database competence includes indexing and why an index is not free, transaction isolation and the anomalies each level permits, normalisation versus deliberate denormalisation for read patterns, and migration strategy on a table that is in use. Probing migrations is especially informative because it requires thinking about the state between two states.

Reliability competence covers timeouts, retries and their interaction with idempotency, backpressure, partial failure and observability. A candidate who adds retries without mentioning idempotency has not operated a system under load.

For data-oriented roles, add query reasoning, data quality and validation, defining a metric precisely enough that two people compute it identically, and communicating a finding with its uncertainty. Ask about an analysis whose conclusion was inconvenient and what they did with it.

Security hygiene appears in every backend role: input validation at the boundary, parameterised queries, secret handling, authentication versus authorisation, and least privilege.`,
  },
  {
    source: 'product-design-competencies.md',
    title: 'Product and Design Competencies',
    category: 'competency',
    roles: ['product-manager', 'designer', 'product'],
    text: `Product and design roles are evaluated on problem framing before solution quality. Ask a candidate to describe a feature they killed or reduced in scope, and why — the decision to not build is where product judgement is most visible.

Product management competencies: discovery and evidence gathering, prioritisation under a fixed team size, writing requirements that survive contact with engineering, stakeholder management without authority, and defining success metrics before launch rather than after.

Design competencies: user research and synthesis, interaction and information architecture, visual craft, systems thinking across components and states, and the ability to explain a design decision in terms of the user problem rather than preference.

For both, portfolio and case-study review should be interrogated, not admired. Ask what the constraints were, what was cut, which parts were theirs, what the result was, and what they would change.

Collaboration signals: how they handle engineering pushback on feasibility, how they include the team in discovery rather than delivering conclusions, and how they respond when data contradicts the design they advocated.`,
  },
  {
    source: 'sales-competency-framework.md',
    title: 'Sales and Business Development Competencies',
    category: 'competency',
    roles: ['sales', 'business-development', 'account-manager'],
    text: `Sales roles are unusual in that past performance is partly quantified, so interviews should verify the context behind the number rather than the number itself. Ask about quota, attainment, average deal size, sales cycle length, territory, inbound versus outbound mix, and what share of pipeline they generated themselves.

Core competencies: pipeline generation and management, qualification discipline, discovery and needs analysis, objection handling, negotiation and commercial judgement, forecast accuracy, and customer relationship depth. For managers add coaching, territory design, and hiring or ramping reps.

Qualification discipline is the strongest differentiator in small companies, where wasted cycles are expensive. Ask how they decide to walk away from a deal, and for a specific deal they disqualified early that a less disciplined rep would have pursued.

Forecast accuracy is a proxy for honesty. Ask how close their last few forecasts were and what they do when a committed deal slips. Candidates who have never missed a forecast have either not carried one or are not reporting accurately.

Probe a loss in detail. The account of a lost deal reveals whether they diagnose causes or attribute outcomes to price, product and luck.`,
  },
  {
    source: 'operations-support-competencies.md',
    title: 'Operations, Support and Administrative Competencies',
    category: 'competency',
    roles: ['operations', 'customer-support', 'administration', 'finance'],
    text: `Operations and support roles are evaluated on reliability under volume, process improvement, judgement on exceptions, and communication with people who are frustrated.

Core competencies: process execution and documentation, prioritisation across competing urgent requests, exception handling and escalation judgement, tooling and automation instinct, accuracy under repetition, and customer communication tone.

The highest-signal question for these roles is about a process the candidate changed. Ask what was broken, how they measured it, what they changed, who they had to convince, and what happened afterwards. Candidates who only execute given processes and candidates who improve them perform very differently in small companies.

For support specifically, probe a conversation with an angry customer where the customer was wrong, and one where the company was wrong. The two answers together show whether they can hold a boundary and whether they can own a failure.

For finance and administrative roles, add controls thinking: separation of duties, reconciliation habits, what they do when the numbers do not tie, and their comfort raising a discrepancy involving someone senior.`,
  },
  {
    source: 'marketing-competencies.md',
    title: 'Marketing Competencies',
    category: 'competency',
    roles: ['marketing', 'growth', 'content'],
    text: `Marketing roles in small businesses are judged on measurable contribution with a small budget, so interviews should separate candidates who ran campaigns from candidates who ran channels they can account for.

Core competencies: audience and positioning clarity, channel execution depth in at least one channel, content and messaging craft, analytics and attribution literacy, budget discipline, and the ability to run an experiment that can fail.

Ask for a campaign that underperformed and what they learned. Marketing candidates commonly present only successes; the analysis of a failure shows whether they understand causality or are reporting correlations.

Attribution literacy matters more than tool familiarity. Ask how they knew a channel worked, what the counterfactual was, and how they handled a channel that looked good on last-click but not on incrementality.

For content roles, ask for the brief behind a piece: who it was for, what it was meant to change, how it was distributed, and what it achieved. Craft without distribution thinking is a common gap.`,
  },
  {
    source: 'seniority-expectations.md',
    title: 'Seniority Expectations and Calibration',
    category: 'competency',
    roles: ['all'],
    text: `Seniority is scope and autonomy, not years served. Calibrate the rubric bar to the level being hired, and state the calibration in the job description so candidates self-select accurately.

Junior or entry level: executes well-defined work with regular guidance, asks for help at the right time, learning rate is the primary signal, and prior experience may be substituted by demonstrated aptitude in a work sample.

Mid level: owns defined problems end to end with little supervision, estimates realistically, handles ambiguity in implementation if not in problem definition, and is a net contributor to the team's output within weeks.

Senior: owns ambiguous problems, decomposes work for others, anticipates second-order consequences, raises the standard of those around them through review and mentoring, and is accountable for outcomes rather than tasks.

Lead or managerial: sets direction, makes hiring and prioritisation calls, is measured by the output and growth of a group, and is evaluated additionally on coaching, delegation and difficult conversations.

Be explicit about which competencies a junior candidate may be weak in at hire. A rubric applied without level calibration rejects strong junior candidates for lacking senior behaviours.`,
  },
  {
    source: 'small-business-hiring-constraints.md',
    title: 'Hiring Constraints Specific to Small Businesses',
    category: 'process',
    roles: ['all'],
    text: `Small businesses hire under constraints that change what to evaluate for. A new hire is a large share of capacity, ramp time is not absorbed by a bench, and roles are broader than their title suggests.

Evaluate breadth tolerance explicitly. Ask about a time the candidate worked outside their job description, and whether they found it energising or frustrating. Specialists who need a narrow remit often struggle in a five-person company regardless of skill.

Evaluate self-direction. There is rarely a manager with time to assign daily work. Ask how they decide what to do when nobody tells them, and what they did in their first month of a previous job before context arrived.

Be honest in the job description about what the company cannot offer: structured career ladders, large budgets, deep specialist mentoring. Candidates who accept a role on an inflated description leave inside a year, which is more expensive for a small team than a slower search.

Compensation guidance should describe the band and the basis for it rather than a precise figure invented without market data. State the range, the currency, whether it includes variable pay or equity, and what moves a candidate within the band.

Keep the process short. Two or three well-structured interviews with written rubric scores beat five unstructured conversations, and small companies lose candidates to slow processes more often than to weak offers.`,
  },
  {
    source: 'work-sample-design.md',
    title: 'Work Samples and Practical Exercises',
    category: 'methodology',
    roles: ['all'],
    text: `A work sample — a small piece of the actual job, done under realistic conditions — is the most predictive single assessment available, ahead of unstructured interviews and general aptitude tests.

Keep it under two hours of candidate time, pay for anything longer, and never use candidate work in production. Long unpaid exercises filter for availability rather than ability and disproportionately exclude candidates with caring responsibilities.

Design the exercise so the reasoning is visible, not just the artefact. A short written rationale, or a discussion of the submission, is where the signal concentrates. Two candidates can produce the same output with very different understanding.

Score work samples with the same rubric dimensions used in interviews, not a separate ad hoc judgement, so evidence from both stages accumulates on the same competencies.

Give every candidate the same brief, the same time, and the same clarifications. If one candidate asked a question that materially helped, add the answer to the brief for everyone.`,
  },
  {
    source: 'job-description-writing.md',
    title: 'Writing Job Descriptions That Attract and Filter',
    category: 'process',
    roles: ['all'],
    text: `A job description does two jobs: attract candidates who would succeed, and deter candidates who would not. Descriptions that only attract generate volume and waste the hiring manager's time.

Lead with outcomes rather than duties. "Own our checkout flow and reduce payment failure rate" tells a candidate what success is; "responsible for frontend development" does not.

State requirements as capabilities with a proficiency level, and separate genuine requirements from preferences. Long undifferentiated requirement lists measurably reduce applications from candidates who would have succeeded, particularly those who self-assess conservatively.

Six to eight responsibilities is the usable range. Beyond that the list reads as a wish list assembled from several roles and candidates stop believing it.

Describe the team, the tools, the stage of the company and the parts of the job that are unglamorous. Specificity is credible; superlatives are not. "Rockstar" and "work hard play hard" carry no information and narrow the applicant pool.

Include the compensation basis. Ranges increase qualified applications and remove the mismatch discovered at offer stage.`,
  },
  {
    source: 'candidate-comparison-practice.md',
    title: 'Comparing Candidates Fairly',
    category: 'evaluation',
    roles: ['all'],
    text: `Comparison happens after all candidates have been scored against the rubric independently, never during interviewing.

Compare dimension by dimension before comparing totals. A total hides the shape of a candidate: two candidates at 80 percent can have opposite strength profiles, and which one to hire depends on the team's existing gaps.

Treat small total differences as ties. Interview scoring error is large; a two-point gap on a thirty-point scale is noise. When candidates are within noise, decide on the dimensions that matter most for the role's near-term outcomes and state that reasoning.

Check whether a dimension separated anyone. If every candidate scored 3 on a dimension, it contributed nothing to the decision and may be badly written, or may not belong in the rubric for this role.

Adjust for interviewer effects when candidates were assessed by different people. If one interviewer's average score is a point above another's across candidates, part of the difference between candidates is the interviewer, not the candidate.

Document the decision, including the runner-up and why. It shortens the next search and makes the process defensible.`,
  },
  {
    source: 'reference-and-offer-stage.md',
    title: 'References, Offers and Closing',
    category: 'process',
    roles: ['all'],
    text: `Use references to test specific doubts raised by the rubric, not as a general character check. Prepare two or three questions aimed at the dimensions where the evidence was thin, and ask about behaviour rather than opinion.

Ask referees what the candidate is like to disagree with, what kind of support they needed to do their best work, and what they would put them in charge of. Generic questions produce generic endorsements.

Make the offer verbally, promptly, and with the reasoning: which strengths mattered and what the first ninety days look like. Small companies win candidates on clarity and speed more often than on money.

Set the ramp expectation in writing at offer stage, derived from the rubric: what the person will own at thirty, sixty and ninety days. It converts a hiring assessment into an onboarding plan and reduces early attrition.

Tell rejected candidates promptly and specifically enough to be useful. In a small market, the candidate experience of people you did not hire determines whether their contacts apply next time.`,
  },
];
