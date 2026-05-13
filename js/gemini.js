/* ===== GEMINI.JS — AI Client (powered by Groq / Llama 3.3) ===== */

const Gemini = {
  async generate(prompt) {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
      throw new Error('Groq API key not configured. Add it to data/config.js');
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a professional resume writing assistant. Generate content strictly based on the specific candidate information provided. Do not invent facts, names, or experiences. Stay focused and relevant to the exact inputs given. Follow all formatting instructions exactly.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1024,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Groq API error');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  },

  async rewriteBullet(bullet, context = {}) {
    const roleCtx = [context.position, context.company].filter(Boolean).join(' at ') || 'this role';
    const prompt = `You are an expert resume writer. Rewrite the bullet point below to be more impactful.

Role context: ${roleCtx}
Original bullet: "${bullet}"

STRICT RULES:
- Keep ONLY the facts and activities from the original — do NOT invent achievements, numbers, or responsibilities
- Enhance wording using strong action verbs (Led, Implemented, Optimized, Drove, etc.)
- Apply PAR (Problem-Action-Result) structure only if the original implies a result
- If the original is a simple statement like "I was team lead", rephrase it as "Led team as Team Lead for [company]" — do NOT add fake metrics
- Return ONLY the rewritten bullet, no explanation, no quotes`;
    return this.generate(prompt);
  },

  async generateSummary(name, title, experience, skills, existingSummary = '') {
    const expText = experience.slice(0, 3).map(e =>
      `${e.position} at ${e.company}${e.description ? ': ' + e.description.substring(0, 80) : ''}`
    ).join('\n');

    const baseInstructions = existingSummary
      ? `The user has written this draft summary — improve it while keeping all their specific points:\n"${existingSummary}"\n\nDo NOT ignore their draft. Enhance it only.`
      : `Write a new 3-4 sentence summary based strictly on the profile below.`;

    const prompt = `You are an expert resume writer. ${baseInstructions}

Name: ${name || 'Professional'}
Target Role: ${title || 'Professional'}
Work History:
${expText || 'No experience listed'}
Key Skills: ${skills.slice(0, 10).join(', ') || 'Not specified'}

Rules:
- Write in first person
- ONLY use facts from the profile above — do not invent roles, companies, or achievements
- Avoid generic filler phrases like "results-driven", "passionate professional", "diverse background"
- Focus on what makes this person specifically suited for the target role
- Return only the summary text, no headers`;
    return this.generate(prompt);
  },

  async generateCoverLetter(resumeData, jobDescription) {
    const name = resumeData.personalInfo?.name || 'Professional';
    const expText = (resumeData.experience || []).slice(0, 2).map(e =>
      `${e.position} at ${e.company}: ${e.description?.substring(0, 100)}`
    ).join('\n');

    const prompt = `Write a professional cover letter for a job application.

Applicant: ${name}
Target Role Summary from job posting: ${jobDescription.substring(0, 500)}

Recent Experience:
${expText}

Key Skills: ${(resumeData.skills?.technical || []).slice(0, 8).join(', ')}

Write a 3-paragraph cover letter:
1. Opening with specific role and strong hook
2. Key relevant achievements and skills match
3. Closing with call to action

Format: Plain text, professional tone. Return only the letter body.`;
    return this.generate(prompt);
  },

  async analyzeAts(resumeData, jobDescription) {
    const skills = [
      ...(resumeData.skills?.technical || []),
      ...(resumeData.skills?.soft || [])
    ].join(', ');

    const expText = (resumeData.experience || []).map(e =>
      `${e.position} at ${e.company}`
    ).join(', ');

    const prompt = `You are an ATS (Applicant Tracking System) expert. Analyze this resume against the job description.

RESUME SUMMARY:
Name: ${resumeData.personalInfo?.name || 'Candidate'}
Current Title: ${resumeData.personalInfo?.title || 'Professional'}
Experience: ${expText}
Skills: ${skills}
Summary: ${resumeData.personalInfo?.summary?.substring(0, 200) || ''}

JOB DESCRIPTION:
${jobDescription.substring(0, 600)}

Provide:
1. ATS SCORE: X/100 (be realistic)
2. MATCHING KEYWORDS FOUND: list 5-8
3. MISSING KEYWORDS: list 5-8 important ones
4. TOP 3 IMPROVEMENTS: specific actionable fixes
5. VERDICT: 1 sentence assessment

Format with these exact headers and be concise.`;
    return this.generate(prompt);
  },

  async suggestSkills(title, experience) {
    const expText = experience.slice(0, 3).map(e =>
      `${e.position} at ${e.company}`
    ).join(', ');

    const prompt = `Suggest 10 relevant technical skills and 5 soft skills for a ${title || 'professional'} with experience: ${expText || 'various roles'}.

Format exactly as:
TECHNICAL: skill1, skill2, skill3, skill4, skill5, skill6, skill7, skill8, skill9, skill10
SOFT: skill1, skill2, skill3, skill4, skill5

Return only these two lines.`;
    return this.generate(prompt);
  },

  async matchJobs(resumeData, searchTitle, searchLocation, context) {
    const skills = (resumeData.skills?.technical || []).slice(0, 8).join(', ');
    const expText = (resumeData.experience || []).slice(0, 2).map(e =>
      `${e.position} at ${e.company}`
    ).join(', ');

    const prompt = `You are a job matching AI. Generate 6 realistic job recommendations strictly based on the candidate profile below.

Candidate Profile:
- Target Role: ${searchTitle || 'Software Engineer'}
- Preferred Location: ${searchLocation || 'Remote'}
- Experience: ${expText || 'Various roles'}
- Skills: ${skills || 'Programming, Communication'}
- Additional Context: ${context || 'None'}

Rules:
- Match jobs ONLY to the candidate's actual skills and experience above
- Use real well-known companies relevant to the role
- Tags must be actual skills/tools from the candidate's profile that match the role
- Reason must explain the specific skill/experience match, not generic text
- Salary must be realistic for the role and location

Return a JSON array of exactly 6 jobs with these exact fields:
[
  {
    "title": "Job Title",
    "company": "Real Company Name",
    "location": "City, State or Remote",
    "matchScore": 85,
    "tags": ["skill1", "skill2", "skill3"],
    "reason": "Specific reason this matches the candidate",
    "salary": "$X0k - $Y0k"
  }
]

Return ONLY valid JSON array, no other text.`;
    const result = await this.generate(prompt);
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Invalid job data returned');
    return JSON.parse(jsonMatch[0]);
  },

  async quickAtsScore(resumeData) {
    const p = resumeData.personalInfo || {};
    const experience = resumeData.experience || [];
    const skills = resumeData.skills || {};
    const allText = [
      p.summary || '',
      ...experience.map(e => e.description || ''),
    ].join(' ');

    // Rule-based pre-score (deterministic part)
    let ruleScore = 0;

    // Contact completeness (20 pts)
    if (p.name) ruleScore += 4;
    if (p.email) ruleScore += 4;
    if (p.phone) ruleScore += 4;
    if (p.location) ruleScore += 4;
    if (p.linkedin || p.github) ruleScore += 4;

    // Summary present (10 pts)
    if (p.summary && p.summary.length > 50) ruleScore += 10;

    // Experience quality (25 pts)
    if (experience.length > 0) ruleScore += 8;
    if (experience.length >= 2) ruleScore += 5;
    const actionVerbs = /\b(led|managed|developed|built|designed|implemented|delivered|increased|reduced|improved|created|launched|drove|optimized|architected|spearheaded|executed|collaborated|coordinated|analyzed|streamlined)\b/i;
    if (actionVerbs.test(allText)) ruleScore += 7;
    const hasNumbers = /\b\d+[\%x\+]?|\$[\d,]+|\d+[kK]\b/.test(allText);
    if (hasNumbers) ruleScore += 5;

    // Skills (20 pts)
    const techCount = (skills.technical || []).length;
    if (techCount >= 3) ruleScore += 8;
    if (techCount >= 7) ruleScore += 7;
    if ((skills.soft || []).length >= 2) ruleScore += 5;

    // Education (10 pts)
    if ((resumeData.education || []).length > 0) ruleScore += 10;

    // Projects / Certs (15 pts)
    if ((resumeData.projects || []).length > 0) ruleScore += 8;
    if ((resumeData.certifications || []).length > 0) ruleScore += 7;

    // AI review of content quality (adds/subtracts up to 15 pts from 85 rule cap)
    const snippet = allText.substring(0, 600) || 'No content provided';
    const prompt = `You are an ATS system. Score only the WRITING QUALITY of this resume content from -15 to +15.
Deduct points for: vague language, first-person pronouns ("I", "my"), missing action verbs, generic buzzwords without context.
Add points for: specific achievements, metrics, clear responsibilities, industry-specific keywords.

Content: "${snippet}"

Return ONLY a single integer between -15 and 15. Nothing else.`;

    try {
      const result = await this.generate(prompt);
      const adjustment = parseInt(result.trim());
      const aiAdj = isNaN(adjustment) ? 0 : Math.min(15, Math.max(-15, adjustment));
      return Math.min(100, Math.max(10, ruleScore + aiAdj));
    } catch {
      return Math.min(100, Math.max(10, ruleScore));
    }
  },

  async interviewPrep(resumeData, jobDescription) {
    const p = resumeData.personalInfo || {};
    const expText = (resumeData.experience || []).slice(0, 3).map(e =>
      `${e.position} at ${e.company}: ${e.description?.substring(0, 120) || 'Not described'}`
    ).join('\n');
    const skills = [...(resumeData.skills?.technical || []), ...(resumeData.skills?.soft || [])].slice(0, 10).join(', ');

    const prompt = `You are an expert interview coach. Generate interview preparation based ONLY on this candidate's actual profile and the job description.

CANDIDATE PROFILE:
Name: ${p.name || 'Candidate'}
Current Title: ${p.title || 'Professional'}
Experience:
${expText || 'No experience listed'}
Skills: ${skills || 'None listed'}

JOB DESCRIPTION:
${jobDescription.substring(0, 700)}

Generate exactly 6 likely interview questions for THIS specific role and candidate. For each, provide a STAR-format answer framework using ONLY their actual experience above — do not invent examples.

Return ONLY a JSON array:
[
  {
    "question": "Specific interview question?",
    "type": "Behavioral|Technical|Situational",
    "framework": "STAR answer using their real experience from the profile above",
    "keyPoints": ["point1 from their experience", "point2", "point3"]
  }
]

Return ONLY valid JSON array, nothing else.`;
    const result = await this.generate(prompt);
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Could not parse interview questions');
    return JSON.parse(jsonMatch[0]);
  },

  async linkedinContent(resumeData) {
    const p = resumeData.personalInfo || {};
    const expText = (resumeData.experience || []).slice(0, 3).map(e =>
      `${e.position} at ${e.company}${e.description ? ': ' + e.description.substring(0, 120) : ''}`
    ).join('\n');
    const skills = [...(resumeData.skills?.technical || []), ...(resumeData.skills?.soft || [])].slice(0, 10).join(', ');

    const prompt = `You are a LinkedIn profile expert. Write content using ONLY this candidate's actual experience — no invented metrics or achievements.

CANDIDATE:
Name: ${p.name || ''}
Title: ${p.title || ''}
Experience:
${expText || 'No experience listed'}
Skills: ${skills || 'None listed'}
Existing Summary: ${p.summary?.substring(0, 200) || 'None'}

Generate:
1. HEADLINE: One LinkedIn headline (max 220 chars) using their actual title and top skills only
2. ABOUT: 3-paragraph About section in first person using only their real experience. No invented numbers.

Return ONLY valid JSON:
{
  "headline": "...",
  "about": "..."
}`;
    const result = await this.generate(prompt);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse LinkedIn content');
    return JSON.parse(jsonMatch[0]);
  },

  async coldEmail(resumeData, company, contactName, purpose) {
    const p = resumeData.personalInfo || {};
    const expText = (resumeData.experience || []).slice(0, 2).map(e =>
      `${e.position} at ${e.company}`
    ).join(', ');
    const skills = (resumeData.skills?.technical || []).slice(0, 5).join(', ');

    const prompt = `Write a concise professional cold email based ONLY on the sender's actual background below.

Sender: ${p.name || 'Candidate'} (${p.title || 'Professional'})
Recipient: ${contactName || 'Hiring Manager'} at ${company || 'the company'}
Purpose: ${purpose || 'Explore job opportunities'}
Sender's experience: ${expText || 'Various roles'}
Key skills: ${skills || 'Various skills'}

Rules:
- Max 130 words
- Start with a specific hook, NOT "I am reaching out" or "I hope this email finds you well"
- Reference the company by name
- Mention ONE specific skill or achievement from the sender's real background
- End with a clear single ask (15-min call, review application, etc.)
- Professional but conversational tone
- NO generic filler phrases

Return ONLY the email body text. No subject line. No explanation.`;
    return this.generate(prompt);
  },

  async skillsGap(resumeData, jobDescription) {
    const mySkills = [
      ...(resumeData.skills?.technical || []),
      ...(resumeData.skills?.soft || [])
    ];
    const expText = (resumeData.experience || []).slice(0, 3).map(e =>
      `${e.position} at ${e.company}: ${e.description?.substring(0, 100) || ''}`
    ).join('\n');

    const prompt = `You are a career advisor doing a precise skills gap analysis. Only list skills that are genuinely required or mentioned in the job description.

CANDIDATE SKILLS: ${mySkills.join(', ') || 'None listed'}
CANDIDATE EXPERIENCE:
${expText || 'None listed'}

JOB DESCRIPTION:
${jobDescription.substring(0, 700)}

Return ONLY valid JSON:
{
  "matchPercent": 72,
  "have": ["skills from JD requirements the candidate already has — only include if actually in their profile"],
  "missing": ["important required skills from JD the candidate lacks"],
  "niceToHave": ["bonus/optional skills from JD the candidate lacks"],
  "learn": [
    {"skill": "Top missing skill", "why": "Why it matters for this specific role", "resource": "Specific course or certification name"},
    {"skill": "Second missing skill", "why": "...", "resource": "..."},
    {"skill": "Third missing skill", "why": "...", "resource": "..."}
  ]
}`;
    const result = await this.generate(prompt);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse skills gap data');
    return JSON.parse(jsonMatch[0]);
  },

  async generateBullets(role, company, responsibility) {
    const prompt = `You are an expert resume writer. Generate 3 strong resume bullet point variations for this specific activity.

Role: ${role || 'Professional'}
Company: ${company || 'the company'}
Activity/Responsibility: "${responsibility}"

STRICT RULES:
- Base EVERY bullet ONLY on the activity described above — do NOT invent metrics or achievements not implied
- Use different strong action verbs for each (Led, Implemented, Developed, Managed, Designed, etc.)
- Each bullet should be 1-2 lines, concise and specific to what was described
- Vary the structure: one result-focused, one scope-focused, one method-focused
- If the activity is vague, write a clean professional bullet without fake numbers

Return ONLY a JSON array of exactly 3 strings:
["bullet one here", "bullet two here", "bullet three here"]`;
    const result = await this.generate(prompt);
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Could not parse bullet options');
    return JSON.parse(jsonMatch[0]);
  },

  async salaryEstimate(resumeData) {
    const p = resumeData.personalInfo || {};
    const expText = (resumeData.experience || []).slice(0, 3).map(e =>
      `${e.position} at ${e.company} (${e.startDate || ''}${e.current ? '-Present' : (e.endDate ? '-' + e.endDate : '')})`
    ).join(', ');
    const skills = (resumeData.skills?.technical || []).slice(0, 8).join(', ');

    const prompt = `You are a compensation expert. Estimate realistic ${new Date().getFullYear()} salary for this candidate based ONLY on the data provided.

Role: ${p.title || 'Professional'}
Location: ${p.location || 'United States'}
Work history: ${expText || 'Not specified'}
Technical skills: ${skills || 'Not specified'}

Return ONLY valid JSON with realistic market rates:
{
  "min": 85000,
  "mid": 105000,
  "max": 125000,
  "currency": "USD",
  "basis": "per year",
  "reasoning": "2 sentences explaining the range specifically based on their role, location, and experience",
  "negotiationTips": [
    "Specific tip based on their strongest skill or experience",
    "Tip about timing or approach",
    "Tip about benefits/equity if base is at ceiling"
  ]
}`;
    const result = await this.generate(prompt);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse salary data');
    return JSON.parse(jsonMatch[0]);
  },

  async analyzeAtsStructured(resumeData, jobDescription) {
    const skills = [
      ...(resumeData.skills?.technical || []),
      ...(resumeData.skills?.soft || [])
    ].join(', ');
    const expText = (resumeData.experience || []).map(e =>
      `${e.position} at ${e.company}: ${e.description?.substring(0, 100) || ''}`
    ).join('\n');

    const prompt = `You are an ATS (Applicant Tracking System). Analyze this resume precisely against the job description.

RESUME:
Title: ${resumeData.personalInfo?.title || ''}
Experience:
${expText || 'None'}
Skills: ${skills || 'None'}
Summary: ${resumeData.personalInfo?.summary?.substring(0, 200) || ''}

JOB DESCRIPTION:
${jobDescription.substring(0, 700)}

Return ONLY valid JSON based on actual keyword analysis:
{
  "score": 72,
  "verdict": "One honest sentence summarizing fit",
  "matchedKeywords": ["up to 8 actual keywords from JD found in resume"],
  "missingKeywords": ["up to 8 important JD keywords missing from resume"],
  "improvements": [
    {"priority": "HIGH", "action": "Specific fix #1 referencing actual missing content"},
    {"priority": "HIGH", "action": "Specific fix #2"},
    {"priority": "MEDIUM", "action": "Specific fix #3"}
  ],
  "sectionScores": {
    "summary": 70,
    "experience": 65,
    "skills": 80,
    "format": 75
  }
}`;
    const result = await this.generate(prompt);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse ATS analysis');
    return JSON.parse(jsonMatch[0]);
  }
};
