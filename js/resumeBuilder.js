/* ===== RESUMEBUILDER.JS — Form + Live Preview ===== */

const ResumeBuilder = {
  data: {
    id: null,
    title: 'My Resume',
    template: 'modern',
    atsScore: 0,
    personalInfo: {},
    experience: [],
    education: [],
    skills: { technical: [], soft: [], lang: [] },
    projects: [],
    certifications: []
  },

  updateTimeout: null,

  newResume() {
    this.data = {
      id: null,
      title: 'My Resume',
      template: 'modern',
      atsScore: 0,
      personalInfo: {},
      experience: [],
      education: [],
      skills: { technical: [], soft: [], lang: [] },
      projects: [],
      certifications: []
    };
    this.clearForm();
    this.renderAllLists();
    this.renderPreview();
    document.getElementById('builderSaveStatus').textContent = 'Not saved';
    App.navigate('builder');
  },

  clearForm() {
    ['name','title','email','phone','location','linkedin','github','website','summary'].forEach(f => {
      const el = document.getElementById(`f-${f}`);
      if (el) el.value = '';
    });
    document.getElementById('techSkillsWrapper').querySelectorAll('.chip').forEach(c => c.remove());
    document.getElementById('softSkillsWrapper').querySelectorAll('.chip').forEach(c => c.remove());
    document.getElementById('langSkillsWrapper').querySelectorAll('.chip').forEach(c => c.remove());
    this.updateAtsDisplay(0);
  },

  loadResume(id) {
    const r = AppState.resumes.find(r => r.id === id);
    if (!r) return toast('Resume not found', 'error');

    this.data = JSON.parse(JSON.stringify(r));
    this.populateForm();
    this.renderAllLists();
    this.renderPreview();
    App.navigate('builder');

    // Set template tabs
    document.querySelectorAll('.template-tab').forEach(t => {
      t.classList.toggle('active', t.textContent.toLowerCase() === this.data.template);
    });
  },

  populateForm() {
    const p = this.data.personalInfo || {};
    const fields = ['name','title','email','phone','location','linkedin','github','website','summary'];
    fields.forEach(f => {
      const el = document.getElementById(`f-${f}`);
      if (el) el.value = p[f] || '';
    });

    // Skills
    ['technical','soft','lang'].forEach(type => {
      const wrapper = document.getElementById(`${type}SkillsWrapper`);
      if (!wrapper) return;
      wrapper.querySelectorAll('.chip').forEach(c => c.remove());
      (this.data.skills[type] || []).forEach(s => this.renderSkillChip(type, s));
    });

    this.updateAtsDisplay(this.data.atsScore || 0);
    document.getElementById('builderSaveStatus').textContent = 'Loaded from cloud';
  },

  readForm() {
    const g = id => document.getElementById(id)?.value?.trim() || '';
    this.data.personalInfo = {
      name: g('f-name'), title: g('f-title'), email: g('f-email'),
      phone: g('f-phone'), location: g('f-location'), linkedin: g('f-linkedin'),
      github: g('f-github'), website: g('f-website'), summary: g('f-summary')
    };
    this.data.title = g('f-name') || 'My Resume';
  },

  update() {
    this.readForm();
    clearTimeout(this.updateTimeout);
    this.updateTimeout = setTimeout(() => this.renderPreview(), 200);
    document.getElementById('builderSaveStatus').textContent = 'Unsaved changes';
  },

  setTemplate(name, btn) {
    this.data.template = name;
    document.querySelectorAll('.template-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    this.renderPreview();
  },

  // ===== EXPERIENCE =====
  addExperience() {
    const id = Date.now().toString();
    this.data.experience.push({ id, company: '', position: '', startDate: '', endDate: '', current: false, description: '', bullets: [] });
    this.renderExperience();
  },

  removeExperience(id) {
    this.data.experience = this.data.experience.filter(e => e.id !== id);
    this.renderExperience();
    this.renderPreview();
  },

  renderExperience() {
    const container = document.getElementById('expList');
    container.innerHTML = this.data.experience.map((exp, i) => `
      <div class="array-item">
        <div class="array-item-header">
          <div class="array-item-title">${exp.position || exp.company || `Experience ${i + 1}`}</div>
          <button class="btn-remove" onclick="ResumeBuilder.removeExperience('${exp.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Company</label>
            <input class="form-input" value="${exp.company}" placeholder="Company Inc." oninput="ResumeBuilder.updateExp('${exp.id}','company',this.value)" />
          </div>
          <div class="form-col">
            <label class="form-label">Position</label>
            <input class="form-input" value="${exp.position}" placeholder="Software Engineer" oninput="ResumeBuilder.updateExp('${exp.id}','position',this.value)" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Start Date</label>
            <input class="form-input" value="${exp.startDate}" placeholder="Jan 2022" oninput="ResumeBuilder.updateExp('${exp.id}','startDate',this.value)" />
          </div>
          <div class="form-col">
            <label class="form-label">End Date</label>
            <input class="form-input" value="${exp.endDate}" placeholder="Present" oninput="ResumeBuilder.updateExp('${exp.id}','endDate',this.value)" ${exp.current ? 'disabled' : ''} />
          </div>
        </div>
        <div class="form-col mb-8">
          <label class="form-label" style="display:flex;align-items:center;gap:6px;cursor:pointer">
            <input type="checkbox" ${exp.current ? 'checked' : ''} onchange="ResumeBuilder.updateExp('${exp.id}','current',this.checked)" />
            Currently working here
          </label>
        </div>
        <div class="form-col" style="margin-bottom:6px">
          <label class="form-label">Description / Achievements</label>
          <textarea class="form-textarea" placeholder="• Led team of 5 engineers to deliver...&#10;• Increased performance by 40%..." oninput="ResumeBuilder.updateExp('${exp.id}','description',this.value)">${exp.description}</textarea>
        </div>
        <button class="btn btn-purple btn-sm" onclick="AIFeatures.rewriteExpBullets('${exp.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="3"/></svg>
          AI ENHANCE
        </button>
      </div>
    `).join('');
  },

  updateExp(id, field, value) {
    const exp = this.data.experience.find(e => e.id === id);
    if (exp) {
      exp[field] = value;
      if (field === 'current' && value) exp.endDate = '';
      const title = exp.position || exp.company || '';
      const el = document.querySelector(`.array-item [oninput*="${id}"]`)?.closest('.array-item')?.querySelector('.array-item-title');
      if (el) el.textContent = title || 'Experience';
      this.renderPreview();
    }
  },

  renderAllLists() {
    this.renderExperience();
    this.renderEducation();
    this.renderProjects();
    this.renderCerts();
  },

  // ===== EDUCATION =====
  addEducation() {
    const id = Date.now().toString();
    this.data.education.push({ id, school: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' });
    this.renderEducation();
  },

  removeEducation(id) {
    this.data.education = this.data.education.filter(e => e.id !== id);
    this.renderEducation();
    this.renderPreview();
  },

  renderEducation() {
    const container = document.getElementById('eduList');
    container.innerHTML = this.data.education.map((edu, i) => `
      <div class="array-item">
        <div class="array-item-header">
          <div class="array-item-title">${edu.school || `Education ${i + 1}`}</div>
          <button class="btn-remove" onclick="ResumeBuilder.removeEducation('${edu.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="form-row">
          <div class="form-col">
            <label class="form-label">School / University</label>
            <input class="form-input" value="${edu.school}" placeholder="MIT" oninput="ResumeBuilder.updateEdu('${edu.id}','school',this.value)" />
          </div>
          <div class="form-col">
            <label class="form-label">Degree</label>
            <input class="form-input" value="${edu.degree}" placeholder="B.S. Computer Science" oninput="ResumeBuilder.updateEdu('${edu.id}','degree',this.value)" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Start Year</label>
            <input class="form-input" value="${edu.startDate}" placeholder="2018" oninput="ResumeBuilder.updateEdu('${edu.id}','startDate',this.value)" />
          </div>
          <div class="form-col">
            <label class="form-label">End Year</label>
            <input class="form-input" value="${edu.endDate}" placeholder="2022" oninput="ResumeBuilder.updateEdu('${edu.id}','endDate',this.value)" />
          </div>
        </div>
        <div class="form-col">
          <label class="form-label">GPA (optional)</label>
          <input class="form-input" value="${edu.gpa}" placeholder="3.8/4.0" oninput="ResumeBuilder.updateEdu('${edu.id}','gpa',this.value)" />
        </div>
      </div>
    `).join('');
  },

  updateEdu(id, field, value) {
    const edu = this.data.education.find(e => e.id === id);
    if (edu) { edu[field] = value; this.renderPreview(); }
  },

  // ===== SKILLS =====
  addSkill(type, e) {
    if (e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const input = e.target;
    const val = input.value.trim().replace(/,$/, '');
    if (!val) return;

    const key = type === 'tech' ? 'technical' : type === 'soft' ? 'soft' : 'lang';
    if (!this.data.skills[key]) this.data.skills[key] = [];
    if (this.data.skills[key].includes(val)) { input.value = ''; return; }

    this.data.skills[key].push(val);
    this.renderSkillChip(type, val);
    input.value = '';
    this.renderPreview();
  },

  renderSkillChip(type, val) {
    const key = type === 'tech' ? 'technical' : type === 'soft' ? 'soft' : 'lang';
    const wrapper = document.getElementById(`${type}SkillsWrapper`) || document.getElementById(`${key}SkillsWrapper`);
    if (!wrapper) return;
    const input = wrapper.querySelector('input');
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.innerHTML = `${val}<button class="chip-remove" onclick="ResumeBuilder.removeSkill('${key}','${val}',this)">×</button>`;
    wrapper.insertBefore(chip, input);
  },

  removeSkill(key, val, btn) {
    this.data.skills[key] = this.data.skills[key].filter(s => s !== val);
    btn.parentElement.remove();
    this.renderPreview();
  },

  // ===== PROJECTS =====
  addProject() {
    const id = Date.now().toString();
    this.data.projects.push({ id, name: '', description: '', technologies: '', link: '' });
    this.renderProjects();
  },

  removeProject(id) {
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    this.renderProjects();
    this.renderPreview();
  },

  renderProjects() {
    const container = document.getElementById('projList');
    container.innerHTML = this.data.projects.map((p, i) => `
      <div class="array-item">
        <div class="array-item-header">
          <div class="array-item-title">${p.name || `Project ${i + 1}`}</div>
          <button class="btn-remove" onclick="ResumeBuilder.removeProject('${p.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="form-col mb-8">
          <label class="form-label">Project Name</label>
          <input class="form-input" value="${p.name}" placeholder="Awesome App" oninput="ResumeBuilder.updateProj('${p.id}','name',this.value)" />
        </div>
        <div class="form-col mb-8">
          <label class="form-label">Technologies</label>
          <input class="form-input" value="${p.technologies}" placeholder="React, Node.js, PostgreSQL" oninput="ResumeBuilder.updateProj('${p.id}','technologies',this.value)" />
        </div>
        <div class="form-col mb-8">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" style="min-height:60px" placeholder="What it does and your impact..." oninput="ResumeBuilder.updateProj('${p.id}','description',this.value)">${p.description}</textarea>
        </div>
        <div class="form-col">
          <label class="form-label">Link (optional)</label>
          <input class="form-input" value="${p.link}" placeholder="github.com/..." oninput="ResumeBuilder.updateProj('${p.id}','link',this.value)" />
        </div>
      </div>
    `).join('');
  },

  updateProj(id, field, value) {
    const p = this.data.projects.find(p => p.id === id);
    if (p) { p[field] = value; this.renderPreview(); }
  },

  // ===== CERTIFICATIONS =====
  addCert() {
    const id = Date.now().toString();
    this.data.certifications.push({ id, name: '', issuer: '', date: '', link: '' });
    this.renderCerts();
  },

  removeCert(id) {
    this.data.certifications = this.data.certifications.filter(c => c.id !== id);
    this.renderCerts();
    this.renderPreview();
  },

  renderCerts() {
    const container = document.getElementById('certList');
    container.innerHTML = this.data.certifications.map((c, i) => `
      <div class="array-item">
        <div class="array-item-header">
          <div class="array-item-title">${c.name || `Certification ${i + 1}`}</div>
          <button class="btn-remove" onclick="ResumeBuilder.removeCert('${c.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Certification Name</label>
            <input class="form-input" value="${c.name}" placeholder="AWS Solutions Architect" oninput="ResumeBuilder.updateCert('${c.id}','name',this.value)" />
          </div>
          <div class="form-col">
            <label class="form-label">Issuer</label>
            <input class="form-input" value="${c.issuer}" placeholder="Amazon" oninput="ResumeBuilder.updateCert('${c.id}','issuer',this.value)" />
          </div>
        </div>
        <div class="form-col">
          <label class="form-label">Date</label>
          <input class="form-input" value="${c.date}" placeholder="2023" oninput="ResumeBuilder.updateCert('${c.id}','date',this.value)" />
        </div>
      </div>
    `).join('');
  },

  updateCert(id, field, value) {
    const c = this.data.certifications.find(c => c.id === id);
    if (c) { c[field] = value; this.renderPreview(); }
  },

  // ===== SAVE =====
  async saveResume() {
    this.readForm();
    try {
      showLoader('SAVING...');
      const id = await AppFS.saveResume({ ...this.data });
      if (!this.data.id) this.data.id = id;
      hideLoader();
      toast('Resume saved successfully', 'success');
    } catch (_) {
      hideLoader();
    }
  },

  // ===== ATS SCORE =====
  async getAtsScore() {
    this.readForm();
    try {
      showLoader('ANALYZING ATS...');
      const score = await Gemini.quickAtsScore(this.data);
      this.data.atsScore = score;
      this.updateAtsDisplay(score);

      // Auto-save the score
      if (this.data.id) {
        await db.collection('users').doc(AppState.user.uid).collection('resumes')
          .doc(this.data.id).update({ atsScore: score });
        const r = AppState.resumes.find(r => r.id === this.data.id);
        if (r) r.atsScore = score;
        AppFS.logScoreHistory(this.data.id, score);
      }

      hideLoader();
      toast(`ATS Score: ${score}%`, score > 70 ? 'success' : 'info');
    } catch (err) {
      hideLoader();
      toast(err.message, 'error');
    }
  },

  updateAtsDisplay(score) {
    document.getElementById('atsScoreDisplay').textContent = score ? `${score}%` : '—';
    document.getElementById('atsBarFill').style.width = `${score}%`;
  },

  // ===== PREVIEW RENDERING =====
  renderPreview() {
    const d = this.data;
    const p = d.personalInfo || {};
    const container = document.getElementById('resumePreview');

    if (!p.name && d.experience.length === 0 && d.education.length === 0) {
      container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text2);font-family:'Space Mono',monospace;font-size:12px;letter-spacing:1px">
        Start filling in your info to see the live preview
      </div>`;
      return;
    }

    const template = d.template || 'modern';
    let html = '';

    if (template === 'modern') html = this.renderModern(d, p);
    else if (template === 'minimal') html = this.renderMinimal(d, p);
    else if (template === 'executive') html = this.renderExecutive(d, p);
    else if (template === 'creative') html = this.renderCreative(d, p);
    else if (template === 'twocol') html = this.renderTwoCol(d, p);
    else if (template === 'tech') html = this.renderTech(d, p);

    container.innerHTML = `<div id="resumeDoc">${html}</div>`;
  },

  contactLine(p) {
    return [p.email, p.phone, p.location, p.linkedin, p.github, p.website]
      .filter(Boolean).join(' | ');
  },

  expHtml(exp) {
    const lines = (exp.description || '').split('\n').filter(Boolean);
    return lines.length > 0
      ? `<ul class="r-exp-desc">${lines.map(l => `<li>${l.replace(/^[•\-]\s*/, '')}</li>`).join('')}</ul>`
      : `<div class="r-exp-desc">${exp.description || ''}</div>`;
  },

  renderModern(d, p) {
    const allSkills = [...(d.skills?.technical || []), ...(d.skills?.soft || [])];
    return `<div class="resume-modern">
      <div class="r-header">
        <div class="r-name">${p.name || ''}</div>
        ${p.title ? `<div style="font-size:14px;color:#0066cc;font-weight:600;margin-bottom:4px">${p.title}</div>` : ''}
        <div class="r-contact">${this.contactLine(p)}</div>
      </div>
      ${p.summary ? `<div class="r-section-title">PROFESSIONAL SUMMARY</div><p style="font-size:11px;color:#333;margin-bottom:8px">${p.summary}</p>` : ''}
      ${d.experience?.length ? `
        <div class="r-section-title">EXPERIENCE</div>
        ${d.experience.map(e => `
          <div class="r-exp-item">
            <div style="display:flex;justify-content:space-between">
              <div class="r-exp-title">${e.position}</div>
              <div style="font-size:11px;color:#666">${e.startDate}${e.endDate || e.current ? ` — ${e.current ? 'Present' : e.endDate}` : ''}</div>
            </div>
            <div class="r-exp-meta">${e.company}</div>
            ${this.expHtml(e)}
          </div>
        `).join('')}` : ''}
      ${d.education?.length ? `
        <div class="r-section-title">EDUCATION</div>
        ${d.education.map(e => `
          <div class="r-exp-item">
            <div style="display:flex;justify-content:space-between">
              <div class="r-exp-title">${e.degree}</div>
              <div style="font-size:11px;color:#666">${e.startDate}${e.endDate ? ` — ${e.endDate}` : ''}</div>
            </div>
            <div class="r-exp-meta">${e.school}${e.gpa ? ` · GPA: ${e.gpa}` : ''}</div>
          </div>
        `).join('')}` : ''}
      ${allSkills.length ? `
        <div class="r-section-title">SKILLS</div>
        <div class="r-skills">${allSkills.map(s => `<span class="r-skill-tag">${s}</span>`).join('')}</div>` : ''}
      ${d.projects?.length ? `
        <div class="r-section-title">PROJECTS</div>
        ${d.projects.map(p => `
          <div class="r-exp-item">
            <div class="r-exp-title">${p.name}${p.technologies ? ` <span style="font-weight:400;color:#666">· ${p.technologies}</span>` : ''}</div>
            <div class="r-exp-desc" style="margin-top:2px">${p.description}</div>
          </div>
        `).join('')}` : ''}
      ${d.certifications?.length ? `
        <div class="r-section-title">CERTIFICATIONS</div>
        ${d.certifications.map(c => `<div style="font-size:11px;margin-bottom:3px"><strong>${c.name}</strong>${c.issuer ? ` — ${c.issuer}` : ''}${c.date ? `, ${c.date}` : ''}</div>`).join('')}` : ''}
    </div>`;
  },

  renderMinimal(d, p) {
    const allSkills = [...(d.skills?.technical || []), ...(d.skills?.soft || [])];
    return `<div class="resume-minimal">
      <div class="r-name">${p.name || ''}</div>
      ${p.title ? `<div style="font-size:12px;color:#666;letter-spacing:1px;margin-bottom:4px">${p.title}</div>` : ''}
      <div class="r-contact">${this.contactLine(p)}</div>
      ${p.summary ? `<div class="r-section-title">SUMMARY</div><p style="font-size:11px;color:#444">${p.summary}</p>` : ''}
      ${d.experience?.length ? `
        <div class="r-section-title">EXPERIENCE</div>
        ${d.experience.map(e => `
          <div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between">
              <div class="r-exp-title">${e.position}${e.company ? `, ${e.company}` : ''}</div>
              <div style="font-size:11px;color:#888;font-style:italic">${e.startDate}${e.current ? ' — Present' : (e.endDate ? ` — ${e.endDate}` : '')}</div>
            </div>
            ${this.expHtml(e)}
          </div>
        `).join('')}` : ''}
      ${d.education?.length ? `
        <div class="r-section-title">EDUCATION</div>
        ${d.education.map(e => `
          <div style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between">
              <div class="r-exp-title">${e.degree}${e.school ? `, ${e.school}` : ''}</div>
              <div style="font-size:11px;color:#888;font-style:italic">${e.startDate}${e.endDate ? ` — ${e.endDate}` : ''}</div>
            </div>
            ${e.gpa ? `<div style="font-size:11px;color:#888">GPA: ${e.gpa}</div>` : ''}
          </div>
        `).join('')}` : ''}
      ${allSkills.length ? `
        <div class="r-section-title">SKILLS</div>
        <div class="r-skills">${allSkills.join(' · ')}</div>` : ''}
      ${d.projects?.length ? `
        <div class="r-section-title">PROJECTS</div>
        ${d.projects.map(p => `
          <div style="margin-bottom:8px">
            <span class="r-exp-title">${p.name}</span>${p.technologies ? ` <span style="color:#666;font-size:11px">· ${p.technologies}</span>` : ''}
            <div style="font-size:11px;color:#444;margin-top:2px">${p.description}</div>
          </div>
        `).join('')}` : ''}
    </div>`;
  },

  renderExecutive(d, p) {
    const allSkills = [...(d.skills?.technical || []), ...(d.skills?.soft || [])];
    return `<div class="resume-executive">
      <div class="r-header">
        <div class="r-name">${p.name || ''}</div>
        ${p.title ? `<div style="font-size:12px;color:rgba(255,255,255,0.7);letter-spacing:1px;margin-top:2px">${p.title}</div>` : ''}
        <div class="r-contact">${this.contactLine(p)}</div>
      </div>
      ${p.summary ? `<div class="r-section-title">EXECUTIVE SUMMARY</div><p style="font-size:11px;color:#333;margin-bottom:8px;font-style:italic">${p.summary}</p>` : ''}
      ${d.experience?.length ? `
        <div class="r-section-title">PROFESSIONAL EXPERIENCE</div>
        ${d.experience.map(e => `
          <div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between">
              <div class="r-exp-title">${e.position}</div>
              <div style="font-size:11px;color:#666;font-style:italic">${e.startDate}${e.current ? ' — Present' : (e.endDate ? ` — ${e.endDate}` : '')}</div>
            </div>
            <div class="r-exp-meta">${e.company}</div>
            ${this.expHtml(e)}
          </div>
        `).join('')}` : ''}
      ${d.education?.length ? `
        <div class="r-section-title">EDUCATION</div>
        ${d.education.map(e => `
          <div style="margin-bottom:6px">
            <div class="r-exp-title">${e.degree} — ${e.school}</div>
            <div class="r-exp-meta">${e.startDate}${e.endDate ? ` — ${e.endDate}` : ''}${e.gpa ? ` · GPA ${e.gpa}` : ''}</div>
          </div>
        `).join('')}` : ''}
      ${allSkills.length ? `
        <div class="r-section-title">CORE COMPETENCIES</div>
        <div class="r-skills">${allSkills.map(s => `<span class="r-skill-tag">${s}</span>`).join('')}</div>` : ''}
    </div>`;
  },

  // ===== CREATIVE TEMPLATE (teal accent sidebar stripe) =====
  renderCreative(d, p) {
    const allSkills = [...(d.skills?.technical || []), ...(d.skills?.soft || [])];
    return `<div class="resume-creative">
      <div class="rc-sidebar-stripe"></div>
      <div class="rc-body">
        <div class="rc-header">
          <div class="rc-name">${p.name || ''}</div>
          ${p.title ? `<div class="rc-title">${p.title}</div>` : ''}
          <div class="rc-contact">
            ${[p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean).map(v => `<span>${v}</span>`).join('<span class="rc-dot">·</span>')}
          </div>
        </div>
        ${p.summary ? `<div class="rc-section"><div class="rc-section-title">ABOUT ME</div><p class="rc-text">${p.summary}</p></div>` : ''}
        ${d.experience?.length ? `
          <div class="rc-section">
            <div class="rc-section-title">EXPERIENCE</div>
            ${d.experience.map(e => `
              <div class="rc-entry">
                <div class="rc-entry-top">
                  <div><span class="rc-entry-title">${e.position}</span><span class="rc-entry-company"> @ ${e.company}</span></div>
                  <div class="rc-entry-date">${e.startDate}${e.current ? ' – Present' : (e.endDate ? ` – ${e.endDate}` : '')}</div>
                </div>
                ${this.expHtml(e)}
              </div>`).join('')}
          </div>` : ''}
        ${d.education?.length ? `
          <div class="rc-section">
            <div class="rc-section-title">EDUCATION</div>
            ${d.education.map(e => `
              <div class="rc-entry">
                <div class="rc-entry-top">
                  <div><span class="rc-entry-title">${e.degree}</span> <span class="rc-entry-company">· ${e.school}</span></div>
                  <div class="rc-entry-date">${e.endDate || e.startDate || ''}</div>
                </div>
                ${e.gpa ? `<div style="font-size:10px;color:#666">GPA: ${e.gpa}</div>` : ''}
              </div>`).join('')}
          </div>` : ''}
        ${allSkills.length ? `
          <div class="rc-section">
            <div class="rc-section-title">SKILLS</div>
            <div class="rc-skills">${allSkills.map(s => `<span class="rc-skill">${s}</span>`).join('')}</div>
          </div>` : ''}
        ${d.projects?.length ? `
          <div class="rc-section">
            <div class="rc-section-title">PROJECTS</div>
            ${d.projects.map(pr => `
              <div class="rc-entry">
                <div class="rc-entry-title">${pr.name} ${pr.technologies ? `<span class="rc-entry-company">· ${pr.technologies}</span>` : ''}</div>
                <div style="font-size:11px;color:#444;margin-top:2px">${pr.description}</div>
              </div>`).join('')}
          </div>` : ''}
      </div>
    </div>`;
  },

  // ===== TWO-COLUMN TEMPLATE =====
  renderTwoCol(d, p) {
    const techSkills = d.skills?.technical || [];
    const softSkills = d.skills?.soft || [];
    return `<div class="resume-twocol">
      <div class="rtc-header">
        <div class="rtc-name">${p.name || ''}</div>
        ${p.title ? `<div class="rtc-role">${p.title}</div>` : ''}
      </div>
      <div class="rtc-body">
        <div class="rtc-left">
          <div class="rtc-contact-block">
            ${p.email ? `<div class="rtc-contact-item"><strong>Email</strong><span>${p.email}</span></div>` : ''}
            ${p.phone ? `<div class="rtc-contact-item"><strong>Phone</strong><span>${p.phone}</span></div>` : ''}
            ${p.location ? `<div class="rtc-contact-item"><strong>Location</strong><span>${p.location}</span></div>` : ''}
            ${p.linkedin ? `<div class="rtc-contact-item"><strong>LinkedIn</strong><span>${p.linkedin}</span></div>` : ''}
            ${p.github ? `<div class="rtc-contact-item"><strong>GitHub</strong><span>${p.github}</span></div>` : ''}
          </div>
          ${techSkills.length ? `
            <div class="rtc-section-title">TECH SKILLS</div>
            <div class="rtc-skill-list">${techSkills.map(s => `<div class="rtc-skill-item">${s}</div>`).join('')}</div>` : ''}
          ${softSkills.length ? `
            <div class="rtc-section-title">SOFT SKILLS</div>
            <div class="rtc-skill-list">${softSkills.map(s => `<div class="rtc-skill-item">${s}</div>`).join('')}</div>` : ''}
          ${d.education?.length ? `
            <div class="rtc-section-title">EDUCATION</div>
            ${d.education.map(e => `
              <div style="margin-bottom:10px">
                <div style="font-weight:700;font-size:11px;color:#1a1a2e">${e.degree}</div>
                <div style="font-size:10px;color:#555">${e.school}</div>
                <div style="font-size:10px;color:#888">${e.endDate || e.startDate || ''}</div>
                ${e.gpa ? `<div style="font-size:10px;color:#888">GPA: ${e.gpa}</div>` : ''}
              </div>`).join('')}` : ''}
          ${d.certifications?.length ? `
            <div class="rtc-section-title">CERTS</div>
            ${d.certifications.map(c => `<div style="font-size:10px;margin-bottom:6px"><strong>${c.name}</strong><br>${c.issuer || ''}${c.date ? ` · ${c.date}` : ''}</div>`).join('')}` : ''}
        </div>
        <div class="rtc-right">
          ${p.summary ? `<div class="rtc-section-title">PROFILE</div><p style="font-size:11px;color:#333;margin-bottom:14px;line-height:1.6">${p.summary}</p>` : ''}
          ${d.experience?.length ? `
            <div class="rtc-section-title">EXPERIENCE</div>
            ${d.experience.map(e => `
              <div style="margin-bottom:12px">
                <div style="display:flex;justify-content:space-between;align-items:baseline">
                  <div style="font-weight:700;font-size:12px;color:#1a1a2e">${e.position}</div>
                  <div style="font-size:10px;color:#888">${e.startDate}${e.current ? '–Present' : (e.endDate ? `–${e.endDate}` : '')}</div>
                </div>
                <div style="font-size:11px;color:#3d6b9a;margin-bottom:3px">${e.company}</div>
                ${this.expHtml(e)}
              </div>`).join('')}` : ''}
          ${d.projects?.length ? `
            <div class="rtc-section-title">PROJECTS</div>
            ${d.projects.map(pr => `
              <div style="margin-bottom:10px">
                <div style="font-weight:700;font-size:12px;color:#1a1a2e">${pr.name} ${pr.technologies ? `<span style="font-weight:400;color:#666;font-size:11px">· ${pr.technologies}</span>` : ''}</div>
                <div style="font-size:11px;color:#333;margin-top:2px">${pr.description}</div>
              </div>`).join('')}` : ''}
        </div>
      </div>
    </div>`;
  },

  // ===== TECH TEMPLATE (dark/monospace for devs) =====
  renderTech(d, p) {
    const allSkills = [...(d.skills?.technical || []), ...(d.skills?.soft || [])];
    return `<div class="resume-tech">
      <div class="rtech-header">
        <div class="rtech-name">${p.name || ''}</div>
        ${p.title ? `<div class="rtech-role">&gt; ${p.title}</div>` : ''}
        <div class="rtech-contact">${[p.email, p.phone, p.location, p.github, p.linkedin].filter(Boolean).join(' | ')}</div>
      </div>
      ${p.summary ? `<div class="rtech-block"><div class="rtech-label">## SUMMARY</div><p class="rtech-text">${p.summary}</p></div>` : ''}
      ${d.experience?.length ? `
        <div class="rtech-block">
          <div class="rtech-label">## EXPERIENCE</div>
          ${d.experience.map(e => `
            <div class="rtech-entry">
              <div class="rtech-entry-header">
                <span class="rtech-entry-title">${e.position}</span>
                <span class="rtech-entry-co"> @ ${e.company}</span>
                <span class="rtech-entry-date">[${e.startDate}${e.current ? '–now' : (e.endDate ? `–${e.endDate}` : '')}]</span>
              </div>
              ${this.expHtml(e)}
            </div>`).join('')}
        </div>` : ''}
      ${d.projects?.length ? `
        <div class="rtech-block">
          <div class="rtech-label">## PROJECTS</div>
          ${d.projects.map(pr => `
            <div class="rtech-entry">
              <div class="rtech-entry-header"><span class="rtech-entry-title">${pr.name}</span>${pr.technologies ? `<span class="rtech-stack"> [${pr.technologies}]</span>` : ''}</div>
              <div class="rtech-text">${pr.description}</div>
            </div>`).join('')}
        </div>` : ''}
      ${allSkills.length ? `
        <div class="rtech-block">
          <div class="rtech-label">## SKILLS</div>
          <div class="rtech-skills">${allSkills.map(s => `<span class="rtech-skill">${s}</span>`).join('')}</div>
        </div>` : ''}
      ${d.education?.length ? `
        <div class="rtech-block">
          <div class="rtech-label">## EDUCATION</div>
          ${d.education.map(e => `
            <div class="rtech-entry">
              <div class="rtech-entry-header">
                <span class="rtech-entry-title">${e.degree}</span>
                <span class="rtech-entry-co"> @ ${e.school}</span>
                <span class="rtech-entry-date">[${e.endDate || e.startDate || ''}]</span>
              </div>
              ${e.gpa ? `<div class="rtech-text">GPA: ${e.gpa}</div>` : ''}
            </div>`).join('')}
        </div>` : ''}
      ${d.certifications?.length ? `
        <div class="rtech-block">
          <div class="rtech-label">## CERTIFICATIONS</div>
          ${d.certifications.map(c => `<div class="rtech-text">${c.name}${c.issuer ? ` — ${c.issuer}` : ''}${c.date ? ` (${c.date})` : ''}</div>`).join('')}
        </div>` : ''}
    </div>`;
  }
};
