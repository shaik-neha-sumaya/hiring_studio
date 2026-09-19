const KIT_SHAPE = `{
  "jobDescription": {
    "roleTitle": "string",
    "roleSummary": "2-3 sentences",
    "keyResponsibilities": ["6 to 8 outcome-focused responsibilities"],
    "requiredSkills": [{ "skill": "string", "proficiency": "Working | Strong | Expert", "why": "one line on why the role needs it" }],
    "niceToHaveSkills": [{ "skill": "string", "why": "one line" }],
    "compensationGuidance": "how to set the band and what moves a candidate within it, with no invented market figures",
    "whyJoinUs": "grounded only in the company context supplied below",
    "whatWeLookFor": "2-3 sentences on the candidate profile"
  },
  "interviewQuestions": {
    "technical": [{ "question": "", "purpose": "", "guidance": "", "whatToLookFor": [""], "dimensions": ["exact rubric dimension name"] }],
    "behavioral": [{ "question": "", "purpose": "", "guidance": "probe instructions, STAR-framed", "whatToLookFor": [""], "dimensions": [""] }],
    "situational": [{ "question": "", "purpose": "", "guidance": "", "whatToLookFor": [""], "dimensions": [""] }],
    "culturalFit": [{ "question": "", "purpose": "", "guidance": "", "whatToLookFor": [""], "dimensions": [""] }]
  },
  "rubric": {
    "dimensions": [{
      "name": "short competency name",
      "description": "what this dimension measures in this role",
      "weight": 1,
      "linkedResponsibilities": ["quote or paraphrase of the responsibility this dimension covers"],
      "levels": { "1": "", "2": "", "3": "", "4": "", "5": "" }
    }]
  }
}`;

function renderContext(chunks) {
  if (!chunks.length) return 'No knowledge base context was retrieved.';
  return chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] source: ${chunk.title} (${chunk.category})\n${chunk.content}`,
    )
    .join('\n\n---\n\n');
}

function renderRoleInput(roleInput) {
  const lines = [
    ['Role title', roleInput.roleTitle],
    ['Seniority', roleInput.seniority],
    ['Employment type', roleInput.employmentType],
    ['Location / arrangement', roleInput.location],
    ['Team or department', roleInput.department],
    ['Company name', roleInput.companyName],
    ['Company size', roleInput.companySize],
    ['Industry', roleInput.industry],
    ['What this person will do (manager notes)', roleInput.responsibilitiesHint],
    ['Must-have skills named by the manager', roleInput.mustHaveSkills],
    ['Company culture notes', roleInput.cultureNotes],
    ['Compensation basis provided', roleInput.compensationNotes],
  ];
  return lines
    .filter(([, value]) => value && String(value).trim())
    .map(([label, value]) => `- ${label}: ${value}`)
    .join('\n');
}

export function buildKitPrompt(roleInput, chunks) {
  return `You are an experienced hiring consultant helping a small business owner who has no HR training. You produce structured hiring kits that are specific, fair, and immediately usable.

# Hiring knowledge base context
Use this retrieved guidance to decide which competencies matter, how to phrase questions, and how to write rubric anchors. Prefer it over generic advice. Do not cite it in the output.

${renderContext(chunks)}

# The role
${renderRoleInput(roleInput)}

# Task
Produce ONE internally consistent hiring kit as JSON matching exactly this shape:

${KIT_SHAPE}

# Hard requirements
1. The three sections must be connected. Every rubric dimension must map to at least one responsibility in the job description, and must be named in the "dimensions" array of at least one interview question. Use the rubric dimension names verbatim when referencing them.
2. Produce 5 to 7 rubric dimensions, specific to THIS role — not a generic list. Cover the craft of the role, judgement, and collaboration. Set "weight" between 1 and 3 to reflect how much of the role's outcome each dimension drives.
3. Rubric level descriptions must be observable behaviour, calibrated to the stated seniority. Level 3 = fully meets the requirements of this role. Never use bare adjectives such as "good communication"; describe what the interviewer would see or hear.
4. Produce 3-4 technical, 3-4 behavioral, 2-3 situational and 2-3 culturalFit questions (9 to 12 in total). Behavioral questions must ask for a specific past example and the guidance must say what to probe for when an answer is missing Situation, Task, Action or Result. Situational questions must use a realistic scenario from this role and company size.
5. Never output filler questions such as "Tell me about yourself", "What is your greatest weakness" or brain teasers.
6. "whatToLookFor" must contain 2-4 concrete observable signals, not restatements of the question.
7. compensationGuidance must explain how to set a band and what moves a candidate within it. Only state figures if the manager supplied them above; otherwise say what data the owner should check.
8. whyJoinUs must use only the supplied company context. If little was supplied, keep it short and honest rather than inventing perks.
9. Write in plain British-neutral business English. No emoji, no marketing superlatives, no markdown inside string values.

Return only the JSON object.`;
}

export function buildRepairPrompt(previousJson, problems) {
  return `The JSON below was produced for a hiring kit but failed validation.

# Problems found
${problems.map((problem) => `- ${problem}`).join('\n')}

# Invalid JSON
${JSON.stringify(previousJson).slice(0, 20000)}

Fix only the listed problems. Keep all other content identical. Preserve the same structure and return only the corrected JSON object.`;
}
