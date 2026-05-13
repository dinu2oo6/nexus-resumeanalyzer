/* ===== AIFEATURES.JS — AI-Powered Resume Features ===== */

const AIFeatures = {

  // ─── HELPERS ────────────────────────────────────────────────────────────────

  async _run(outputId, fn) {
    const el = document.getElementById(outputId);
    el.className = 'ai-output';
    el.textContent = 'Generating...';
    try {
      const result = await fn();
      el.textContent = result;
      el.dataset.ready = '1';
      AppFS.incrementAnalytic('aiAssists');
    } catch (err) {
      el.className = 'ai-output empty';
      el.textContent = `Error: ${err.message}`;
      toast(err.message, 'error');
    }
  },

  copyOutput(id) {
    const el = document.getElementById(id);
    const text = el.textContent || el.innerText || '';
    if (!text || el.classList.contains('empty')) return toast('Nothing to copy', 'error');
    navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard', 'success'));
  },

  // ─── BULLET REWRITER ────────────────────────────────────────────────────────

  async rewriteBullet() {
    const input = document.getElementById('bulletInput').value.trim();
    if (!input) return toast('Enter a bullet point first', 'error');
    await this._run('bulletOutput', () => Gemini.rewriteBullet(input));
  },

  // ─── BULLET GENERATOR ───────────────────────────────────────────────────────

  async generateBullets() {
    const role = document.getElementById('genBulletRole').value.trim();
    const company = document.getElementById('genBulletCompany').value.trim();
    const responsibility = document.getElementById('genBulletDesc').value.trim();
    if (!role || !responsibility) return toast('Enter role and responsibility', 'error');

    const el = document.getElementById('genBulletOutput');
    el.innerHTML = '<div style="color:var(--text2);font-style:italic;font-size:12px">Generating...</div>';

    try {
      const bullets = await Gemini.generateBullets(role, company, responsibility);
      el.innerHTML = bullets.map((b, i) => `
        <div class="bullet-option">
          <div class="bullet-option-num">${i + 1}</div>
          <div class="bullet-option-text">${b}</div>
          <button class="btn-copy-inline" onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent).then(()=>toast('Copied','success'))">COPY</button>
        </div>`).join('');
      AppFS.incrementAnalytic('aiAssists');
    } catch (err) {
      el.innerHTML = `<div style="color:var(--pink);font-size:12px">Error: ${err.message}</div>`;
      toast(err.message, 'error');
    }
  },

  // ─── SUMMARY GENERATOR ──────────────────────────────────────────────────────

  async generateSummaryStandalone() {
    ResumeBuilder.readForm();
    const d = ResumeBuilder.data;
    const targetRole = document.getElementById('summaryJobInput').value.trim()
      || d.personalInfo?.title || 'Professional';
    await this._run('summaryOutput', () =>
      Gemini.generateSummary(
        d.personalInfo?.name,
        targetRole,
        d.experience || [],
        [...(d.skills?.technical || []), ...(d.skills?.soft || [])],
        d.personalInfo?.summary || ''
      )
    );
  },

  pushSummaryToResume() {
    const el = document.getElementById('summaryOutput');
    if (!el.dataset.ready) return toast('Generate a summary first', 'error');
    const text = el.textContent.trim();
    const field = document.getElementById('f-summary');
    if (field) {
      field.value = text;
      ResumeBuilder.data.personalInfo = ResumeBuilder.data.personalInfo || {};
      ResumeBuilder.data.personalInfo.summary = text;
      ResumeBuilder.renderPreview();
      toast('Summary pushed to resume', 'success');
    }
  },

  async generateSummary() {
    ResumeBuilder.readForm();
    const d = ResumeBuilder.data;
    try {
      showLoader('GENERATING SUMMARY...');
      const result = await Gemini.generateSummary(
        d.personalInfo?.name,
        d.personalInfo?.title,
        d.experience || [],
        [...(d.skills?.technical || []), ...(d.skills?.soft || [])],
        d.personalInfo?.summary || ''
      );
      document.getElementById('f-summary').value = result;
      d.personalInfo.summary = result;
      ResumeBuilder.renderPreview();
      hideLoader();
      toast('Summary generated', 'success');
      AppFS.incrementAnalytic('aiAssists');
    } catch (err) {
      hideLoader();
      toast(err.message, 'error');
    }
  },

  // ─── COVER LETTER ───────────────────────────────────────────────────────────

  async generateCoverLetter() {
    ResumeBuilder.readForm();
    const jobDesc = document.getElementById('coverJobDesc').value.trim();
    if (!jobDesc) return toast('Paste a job description first', 'error');
    await this._run('coverOutput', () =>
      Gemini.generateCoverLetter(ResumeBuilder.data, jobDesc)
    );
  },

  // ─── ATS ANALYZER (structured) ──────────────────────────────────────────────

  async analyzeAts() {
    ResumeBuilder.readForm();
    const jobDesc = document.getElementById('atsJobDesc').value.trim();
    if (!jobDesc) return toast('Paste a job description first', 'error');

    const el = document.getElementById('atsOutput');
    el.innerHTML = '<div style="color:var(--text2);font-style:italic;font-size:12px">Analyzing...</div>';

    try {
      const data = await Gemini.analyzeAtsStructured(ResumeBuilder.data, jobDesc);
      this.renderAtsResult(data);
      AppFS.incrementAnalytic('aiAssists');
    } catch (err) {
      el.innerHTML = `<div style="color:var(--pink);font-size:12px">Error: ${err.message}</div>`;
      toast(err.message, 'error');
    }
  },

  renderAtsResult(d) {
    const el = document.getElementById('atsOutput');
    const score = d.score || 0;
    const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--pink)';
    const sections = d.sectionScores || {};

    el.innerHTML = `
      <div class="ats-result">
        <div class="ats-result-top">
          <div class="ats-result-score" style="color:${color}">${score}<span style="font-size:14px">/100</span></div>
          <div style="flex:1">
            <div style="font-size:12px;color:var(--text);margin-bottom:4px">${d.verdict || ''}</div>
            <div class="ats-section-bars">
              ${Object.entries(sections).map(([k, v]) => `
                <div class="ats-section-bar-row">
                  <span>${k}</span>
                  <div class="ats-mini-bar"><div style="width:${v}%;background:${v>=70?'var(--green)':v>=50?'var(--yellow)':'var(--pink)'}"></div></div>
                  <span>${v}%</span>
                </div>`).join('')}
            </div>
          </div>
        </div>
        <div class="ats-keywords-row">
          <div class="ats-kw-block">
            <div class="ats-kw-label" style="color:var(--green)">MATCHED KEYWORDS</div>
            <div class="ats-kw-chips">${(d.matchedKeywords||[]).map(k=>`<span class="kw-chip matched">${k}</span>`).join('')}</div>
          </div>
          <div class="ats-kw-block">
            <div class="ats-kw-label" style="color:var(--pink)">MISSING KEYWORDS</div>
            <div class="ats-kw-chips">${(d.missingKeywords||[]).map(k=>`<span class="kw-chip missing">${k}</span>`).join('')}</div>
          </div>
        </div>
        <div class="ats-improvements">
          <div class="ats-kw-label" style="color:var(--cyan);margin-bottom:8px">ACTION ITEMS</div>
          ${(d.improvements||[]).map(imp=>`
            <div class="ats-improvement-item">
              <span class="ats-priority ${imp.priority?.toLowerCase()}">${imp.priority}</span>
              <span>${imp.action}</span>
            </div>`).join('')}
        </div>
      </div>`;
  },

  // ─── LINKEDIN CONTENT ───────────────────────────────────────────────────────

  async generateLinkedin() {
    ResumeBuilder.readForm();
    const el = document.getElementById('linkedinOutput');
    el.innerHTML = '<div style="color:var(--text2);font-style:italic;font-size:12px">Generating...</div>';

    try {
      const data = await Gemini.linkedinContent(ResumeBuilder.data);
      el.innerHTML = `
        <div class="li-section">
          <div class="li-section-label">HEADLINE</div>
          <div class="li-section-text" id="li-headline">${data.headline || ''}</div>
          <button class="btn-copy-inline" onclick="navigator.clipboard.writeText(document.getElementById('li-headline').textContent).then(()=>toast('Copied','success'))">COPY</button>
        </div>
        <div class="li-section" style="margin-top:12px">
          <div class="li-section-label">ABOUT SECTION</div>
          <div class="li-section-text" id="li-about" style="white-space:pre-wrap">${data.about || ''}</div>
          <button class="btn-copy-inline" onclick="navigator.clipboard.writeText(document.getElementById('li-about').textContent).then(()=>toast('Copied','success'))">COPY</button>
        </div>`;
      AppFS.incrementAnalytic('aiAssists');
    } catch (err) {
      el.innerHTML = `<div style="color:var(--pink);font-size:12px">Error: ${err.message}</div>`;
      toast(err.message, 'error');
    }
  },

  // ─── COLD EMAIL ─────────────────────────────────────────────────────────────

  async generateColdEmail() {
    ResumeBuilder.readForm();
    const company = document.getElementById('coldCompany').value.trim();
    const contact = document.getElementById('coldContact').value.trim();
    const purpose = document.getElementById('coldPurpose').value.trim();
    if (!company) return toast('Enter a company name', 'error');
    await this._run('coldOutput', () =>
      Gemini.coldEmail(ResumeBuilder.data, company, contact, purpose)
    );
  },

  // ─── SKILLS GAP ─────────────────────────────────────────────────────────────

  async analyzeSkillsGap() {
    ResumeBuilder.readForm();
    const jobDesc = document.getElementById('gapJobDesc').value.trim();
    if (!jobDesc) return toast('Paste a job description first', 'error');

    const el = document.getElementById('gapOutput');
    el.innerHTML = '<div style="color:var(--text2);font-style:italic;font-size:12px">Analyzing...</div>';

    try {
      const data = await Gemini.skillsGap(ResumeBuilder.data, jobDesc);
      this.renderSkillsGap(data);
      AppFS.incrementAnalytic('aiAssists');
    } catch (err) {
      el.innerHTML = `<div style="color:var(--pink);font-size:12px">Error: ${err.message}</div>`;
      toast(err.message, 'error');
    }
  },

  renderSkillsGap(d) {
    const el = document.getElementById('gapOutput');
    const pct = d.matchPercent || 0;
    const color = pct >= 70 ? 'var(--green)' : pct >= 45 ? 'var(--yellow)' : 'var(--pink)';
    el.innerHTML = `
      <div class="gap-header">
        <div class="gap-pct" style="color:${color}">${pct}%</div>
        <div style="font-size:11px;color:var(--text2)">SKILLS MATCH</div>
      </div>
      <div class="gap-cols">
        <div>
          <div class="gap-col-label" style="color:var(--green)">YOU HAVE</div>
          ${(d.have||[]).map(s=>`<div class="gap-chip have">${s}</div>`).join('') || '<div style="font-size:11px;color:var(--text2)">None matched</div>'}
        </div>
        <div>
          <div class="gap-col-label" style="color:var(--pink)">MISSING</div>
          ${(d.missing||[]).map(s=>`<div class="gap-chip missing">${s}</div>`).join('') || '<div style="font-size:11px;color:var(--text2)">None</div>'}
        </div>
        <div>
          <div class="gap-col-label" style="color:var(--yellow)">NICE TO HAVE</div>
          ${(d.niceToHave||[]).map(s=>`<div class="gap-chip nice">${s}</div>`).join('') || '<div style="font-size:11px;color:var(--text2)">None</div>'}
        </div>
      </div>
      ${d.learn?.length ? `
        <div class="gap-learn">
          <div class="gap-col-label" style="color:var(--cyan);margin-bottom:8px">TOP SKILLS TO LEARN</div>
          ${d.learn.map(l=>`
            <div class="gap-learn-item">
              <div class="gap-learn-skill">${l.skill}</div>
              <div class="gap-learn-why">${l.why}</div>
              <div class="gap-learn-res">📚 ${l.resource}</div>
            </div>`).join('')}
        </div>` : ''}`;
  },

  // ─── INTERVIEW PREP ─────────────────────────────────────────────────────────

  async generateInterviewPrep() {
    ResumeBuilder.readForm();
    const jobDesc = document.getElementById('interviewJobDesc').value.trim();
    if (!jobDesc) return toast('Paste a job description first', 'error');

    const el = document.getElementById('interviewOutput');
    el.innerHTML = '<div style="color:var(--text2);font-style:italic;font-size:12px">Generating questions...</div>';

    try {
      const questions = await Gemini.interviewPrep(ResumeBuilder.data, jobDesc);
      this.renderInterviewPrep(questions);
      AppFS.incrementAnalytic('aiAssists');
    } catch (err) {
      el.innerHTML = `<div style="color:var(--pink);font-size:12px">Error: ${err.message}</div>`;
      toast(err.message, 'error');
    }
  },

  renderInterviewPrep(questions) {
    const el = document.getElementById('interviewOutput');
    el.innerHTML = questions.map((q, i) => `
      <div class="iq-card">
        <div class="iq-card-header">
          <span class="iq-num">Q${i+1}</span>
          <span class="iq-type ${q.type?.toLowerCase()}">${q.type||'General'}</span>
          <div class="iq-question">${q.question}</div>
        </div>
        <div class="iq-framework">
          <div class="iq-framework-label">STAR FRAMEWORK</div>
          <div class="iq-framework-text">${q.framework}</div>
        </div>
        ${q.keyPoints?.length ? `
          <div class="iq-points">
            ${q.keyPoints.map(p=>`<div class="iq-point">• ${p}</div>`).join('')}
          </div>` : ''}
      </div>`).join('');
  },

  // ─── SALARY ESTIMATOR ───────────────────────────────────────────────────────

  async estimateSalary() {
    ResumeBuilder.readForm();
    const el = document.getElementById('salaryOutput');
    el.innerHTML = '<div style="color:var(--text2);font-style:italic;font-size:12px">Estimating...</div>';

    try {
      const data = await Gemini.salaryEstimate(ResumeBuilder.data);
      this.renderSalaryResult(data);
      AppFS.incrementAnalytic('aiAssists');
    } catch (err) {
      el.innerHTML = `<div style="color:var(--pink);font-size:12px">Error: ${err.message}</div>`;
      toast(err.message, 'error');
    }
  },

  renderSalaryResult(d) {
    const el = document.getElementById('salaryOutput');
    const fmt = n => '$' + (n||0).toLocaleString();
    el.innerHTML = `
      <div class="salary-range">
        <div class="salary-col">
          <div class="salary-label">LOW</div>
          <div class="salary-val" style="color:var(--text2)">${fmt(d.min)}</div>
        </div>
        <div class="salary-col salary-mid">
          <div class="salary-label">TARGET</div>
          <div class="salary-val" style="color:var(--cyan)">${fmt(d.mid)}</div>
          <div style="font-size:10px;color:var(--text2)">${d.basis||'per year'}</div>
        </div>
        <div class="salary-col">
          <div class="salary-label">HIGH</div>
          <div class="salary-val" style="color:var(--green)">${fmt(d.max)}</div>
        </div>
      </div>
      <div class="salary-reasoning">${d.reasoning||''}</div>
      ${d.negotiationTips?.length ? `
        <div class="salary-tips-label">NEGOTIATION TIPS</div>
        ${d.negotiationTips.map(t=>`<div class="salary-tip">→ ${t}</div>`).join('')}` : ''}`;
  },

  // ─── ENHANCE EXP BULLETS (from Builder) ────────────────────────────────────

  async suggestSkills() {
    ResumeBuilder.readForm();
    const d = ResumeBuilder.data;
    try {
      showLoader('SUGGESTING SKILLS...');
      const result = await Gemini.suggestSkills(d.personalInfo?.title, d.experience || []);

      const techLine = result.match(/TECHNICAL:\s*(.+)/i)?.[1] || '';
      const softLine = result.match(/SOFT:\s*(.+)/i)?.[1] || '';
      const techSkills = techLine.split(',').map(s => s.trim()).filter(Boolean);
      const softSkills = softLine.split(',').map(s => s.trim()).filter(Boolean);

      let added = 0;
      techSkills.forEach(s => {
        if (!d.skills.technical.includes(s)) {
          d.skills.technical.push(s);
          ResumeBuilder.renderSkillChip('tech', s);
          added++;
        }
      });
      softSkills.forEach(s => {
        if (!d.skills.soft.includes(s)) {
          d.skills.soft.push(s);
          ResumeBuilder.renderSkillChip('soft', s);
          added++;
        }
      });

      ResumeBuilder.renderPreview();
      hideLoader();
      toast(`Added ${added} skill suggestions`, 'success');
      AppFS.incrementAnalytic('aiAssists');
    } catch (err) {
      hideLoader();
      toast(err.message, 'error');
    }
  },

  async rewriteExpBullets(expId) {
    const exp = ResumeBuilder.data.experience.find(e => e.id === expId);
    if (!exp || !exp.description) return toast('Add a job description first', 'error');
    try {
      showLoader('ENHANCING BULLETS...');
      const lines = exp.description.split('\n').filter(Boolean);
      const rewritten = await Promise.all(
        lines.map(l => Gemini.rewriteBullet(l, { position: exp.position, company: exp.company }))
      );
      exp.description = rewritten.map(l => `• ${l}`).join('\n');
      ResumeBuilder.renderExperience();
      ResumeBuilder.renderPreview();
      hideLoader();
      toast('Bullets enhanced with AI', 'success');
      AppFS.incrementAnalytic('aiAssists');
    } catch (err) {
      hideLoader();
      toast(err.message, 'error');
    }
  }
};
