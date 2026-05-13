/* ===== JOBMATCHER.JS — AI Job Matching ===== */

const JobMatcher = {
  async findJobs() {
    ResumeBuilder.readForm();
    const title = document.getElementById('jobSearchTitle').value.trim();
    const location = document.getElementById('jobSearchLocation').value.trim();
    const context = document.getElementById('jobSearchContext').value.trim();

    const resultsEl = document.getElementById('jobResults');
    const skillsEl = document.getElementById('skillsMatchPanel');

    resultsEl.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--text2)">
        <div class="loader-ring" style="margin:0 auto 12px"></div>
        <div style="font-family:'Space Mono',monospace;font-size:10px;letter-spacing:2px">MATCHING JOBS...</div>
      </div>`;

    try {
      const jobs = await Gemini.matchJobs(ResumeBuilder.data, title, location, context);
      this.renderJobs(jobs);
      this.renderSkillsMatch(jobs);
      AppFS.incrementAnalytic('aiAssists');
    } catch (err) {
      resultsEl.innerHTML = `<div class="empty-state"><p>Error: ${err.message}</p></div>`;
      toast(err.message, 'error');
    }
  },

  renderJobs(jobs) {
    const el = document.getElementById('jobResults');
    if (!jobs || jobs.length === 0) {
      el.innerHTML = '<div class="empty-state"><p>No job matches found. Try different keywords.</p></div>';
      return;
    }

    el.innerHTML = jobs.map(job => {
      const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title + ' ' + job.company)}&location=${encodeURIComponent(job.location)}`;
      const indeedUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(job.title + ' ' + job.company)}&l=${encodeURIComponent(job.location)}`;
      const safeTitle = job.title.replace(/'/g, "\\'");
      const safeCompany = job.company.replace(/'/g, "\\'");
      return `
      <div class="job-card">
        <div class="job-card-header">
          <div>
            <div class="job-title">${job.title}</div>
            <div class="job-company">${job.company} · ${job.location}</div>
          </div>
          <div>
            <div class="match-score">${job.matchScore}%</div>
            ${job.salary ? `<div style="font-size:10px;color:var(--text2);text-align:right;font-family:'Space Mono',monospace">${job.salary}</div>` : ''}
          </div>
        </div>
        ${job.reason ? `<div style="font-size:12px;color:var(--text2);margin-bottom:8px;line-height:1.4">${job.reason}</div>` : ''}
        <div class="job-tags">
          ${(job.tags || []).map(t => `<span class="job-tag">${t}</span>`).join('')}
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          <a href="${linkedinUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-cyan btn-sm" style="text-decoration:none">APPLY ON LINKEDIN</a>
          <a href="${indeedUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm" style="text-decoration:none;border:1px solid var(--border);color:var(--text2)">INDEED</a>
          <button class="btn btn-sm" style="border:1px solid var(--border);color:var(--text2)" onclick="JobMatcher.applyWithResume('${safeTitle}', '${safeCompany}')">TAILOR RESUME</button>
        </div>
      </div>`;
    }).join('');
  },

  renderSkillsMatch(jobs) {
    const el = document.getElementById('skillsMatchPanel');
    if (!jobs || jobs.length === 0) {
      el.innerHTML = '<p style="font-size:12px;color:var(--text2)">No data</p>';
      return;
    }

    const allTags = jobs.flatMap(j => j.tags || []);
    const freq = {};
    allTags.forEach(t => freq[t] = (freq[t] || 0) + 1);
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 12);

    const mySkills = [
      ...(ResumeBuilder.data.skills?.technical || []).map(s => s.toLowerCase()),
      ...(ResumeBuilder.data.skills?.soft || []).map(s => s.toLowerCase())
    ];

    el.innerHTML = `
      <div style="margin-bottom:12px;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--text2)">TOP REQUIRED SKILLS</div>
      ${sorted.map(([tag, count]) => {
        const match = mySkills.some(s => s.includes(tag.toLowerCase()) || tag.toLowerCase().includes(s));
        return `
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:6px">
              <div style="width:6px;height:6px;border-radius:50%;background:${match ? 'var(--green)' : 'var(--pink)'};box-shadow:0 0 6px ${match ? 'var(--green)' : 'var(--pink)'}"></div>
              <span style="font-size:12px;color:var(--text)">${tag}</span>
            </div>
            <span style="font-family:'Space Mono',monospace;font-size:9px;color:var(--text2)">${count} jobs</span>
          </div>`;
      }).join('')}
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
        <div style="font-family:'Space Mono',monospace;font-size:9px;color:var(--text2);margin-bottom:6px">MATCH LEGEND</div>
        <div style="display:flex;gap:12px;font-size:11px">
          <span style="color:var(--green)">● You have it</span>
          <span style="color:var(--pink)">● Missing</span>
        </div>
      </div>
    `;
  },

  async applyWithResume(title, company) {
    App.navigate('ai');
    const el = document.getElementById('coverJobDesc');
    el.value = `${title} position at ${company}`;
    toast('Switched to AI tools — generate your cover letter!', 'info');
  }
};
