const Groq = require('groq-sdk');
const Experience = require('../models/Experience.model');
const Company    = require('../models/Company.model');

// ─── Build context string from past experiences ───────────────────────────────
const fetchExperiencesForCompanyRole = async (companyId, role) => {
  const filter = { company: companyId, isDeleted: false };

  if (role?.trim()) {
    filter.role = { $regex: role.trim(), $options: 'i' };
  }

  const experiences = await Experience.find(filter)
    .populate('company', 'name sector')
    .sort({ upvoteCount: -1, createdAt: -1 })
    .limit(5) // ✅ reduced from 15 to 5
    .lean();

  if (!experiences.length) return { context: null, count: 0 };

  const lines = experiences.map((exp, i) => {
    const roundsText = exp.rounds?.slice(0, 3).map((r) => { // ✅ max 3 rounds
      const qs = r.questions?.filter(Boolean).slice(0, 2).map(q => q.slice(0, 100)).join(' | ') || 'None'; // ✅ max 2 questions, 100 chars each
      return `  • ${r.type?.toUpperCase()}: ${qs}`;
    }).join('\n') || '  • No rounds';

    return `[${i + 1}] ${exp.role} | ${exp.verdict} | Diff:${exp.difficulty}/5 | Year:${exp.year}
${roundsText}
Tips: ${(exp.tips || 'None').slice(0, 150)}`; // ✅ tips truncated to 150 chars
  });

  return {
    context: lines.join('\n\n'),
    count: experiences.length,
  };
};

// ─── System prompt ────────────────────────────────────────────────────────────
const buildPrompt = (companyName, role, context, count) => {
  const contextSection = context
    ? `${count} real experiences from seniors at ${companyName}:\n${context}`
    : `No past experiences available for ${companyName}. Use general knowledge about their interview process.`;

  return `You are a placement mentor at a top Indian engineering college. Give a concise, actionable interview prep guide for "${role || 'Software Engineer'}" at "${companyName}".

${contextSection}

Reply with these sections only:

## Interview Process Overview
Typical rounds, format, duration, what to expect.

## Round-wise Breakdown
What each round tests and how to approach it.

## Top Asked Questions
Most frequent questions grouped by round type.

## Preparation Checklist
8 specific tasks in - [ ] format.

## Tips from Seniors
Most valuable, non-obvious tips from the experiences above.

Be direct, specific, and brief. No generic advice.`;
};

// ─── Generate with streaming ──────────────────────────────────────────────────
const generateInterviewPrep = async (companyId, role, onChunk, onDone, onError) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key') {
      onError(new Error('GROQ_API_KEY is not configured. Get your free key at console.groq.com'));
      return;
    }

    const company = await Company.findById(companyId).select('name sector').lean();
    if (!company) {
      onError(new Error('Company not found'));
      return;
    }

    const { context, count } = await fetchExperiencesForCompanyRole(companyId, role);
    const prompt = buildPrompt(company.name, role, context, count);

    const groq = new Groq({ apiKey });

    const stream = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      max_tokens: 1500, // ✅ cap output tokens
      temperature: 0.7,
    });

    // Stream chunks as they arrive
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) onChunk(text);
    }

    onDone({ companyName: company.name, experienceCount: count });
  } catch (err) {
    onError(err);
  }
};

module.exports = { fetchExperiencesForCompanyRole, generateInterviewPrep };