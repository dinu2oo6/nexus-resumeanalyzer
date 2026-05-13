/* ===== ANALYTICS.JS — Dashboard Charts & Metrics ===== */

const Analytics = {
  scoreChart: null,
  activityChart: null,

  async refresh() {
    const resumes = AppState.resumes;
    const meta = AppState.analyticsData || {};

    // Stats
    const scores = resumes.filter(r => r.atsScore > 0).map(r => r.atsScore);
    document.getElementById('an-best').textContent = scores.length ? Math.max(...scores) + '%' : '—';
    document.getElementById('an-avg').textContent = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) + '%' : '—';
    document.getElementById('an-dl').textContent = meta.downloads || 0;
    document.getElementById('an-ai').textContent = meta.aiAssists || 0;

    // Load score history from Firestore
    const history = await AppFS.getScoreHistory();
    this.renderScoreChart(history, resumes);
    this.renderActivityChart(meta);
    this.renderPerformanceTable(resumes);
  },

  renderScoreChart(history, resumes) {
    const ctx = document.getElementById('scoreChart')?.getContext('2d');
    if (!ctx) return;

    if (this.scoreChart) this.scoreChart.destroy();

    let labels, data;
    if (history.length > 0) {
      const sorted = [...history].reverse().slice(-10);
      labels = sorted.map((_, i) => `#${i + 1}`);
      data = sorted.map(h => h.score);
    } else if (resumes.length > 0) {
      const scored = resumes.filter(r => r.atsScore > 0);
      labels = scored.map(r => (r.title || 'Resume').substring(0, 10));
      data = scored.map(r => r.atsScore);
    } else {
      labels = ['No Data'];
      data = [0];
    }

    this.scoreChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'ATS Score',
          data,
          borderColor: '#00e5ff',
          backgroundColor: 'rgba(0,229,255,0.08)',
          borderWidth: 2,
          pointBackgroundColor: '#00e5ff',
          pointBorderColor: '#00e5ff',
          pointRadius: 4,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { color: 'rgba(0,229,255,0.06)' },
            ticks: { color: '#8888aa', font: { family: 'Space Mono', size: 9 } }
          },
          y: {
            min: 0, max: 100,
            grid: { color: 'rgba(0,229,255,0.06)' },
            ticks: { color: '#8888aa', font: { family: 'Space Mono', size: 9 }, callback: v => v + '%' }
          }
        }
      }
    });
  },

  renderActivityChart(meta) {
    const ctx = document.getElementById('activityChart')?.getContext('2d');
    if (!ctx) return;

    if (this.activityChart) this.activityChart.destroy();

    const resumes = AppState.resumes.length;
    const downloads = meta.downloads || 0;
    const aiUses = meta.aiAssists || 0;

    this.activityChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Resumes Created', 'PDF Downloads', 'AI Feature Uses'],
        datasets: [{
          data: [resumes || 1, downloads || 1, aiUses || 1],
          backgroundColor: [
            'rgba(0,229,255,0.7)',
            'rgba(139,92,246,0.7)',
            'rgba(247,37,133,0.7)'
          ],
          borderColor: [
            'rgba(0,229,255,1)',
            'rgba(139,92,246,1)',
            'rgba(247,37,133,1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#8888aa',
              font: { family: 'Space Mono', size: 9 },
              padding: 12,
              boxWidth: 10
            }
          }
        }
      }
    });
  },

  renderPerformanceTable(resumes) {
    const el = document.getElementById('resumePerformanceTable');
    if (resumes.length === 0) {
      el.innerHTML = '<div class="empty-state" style="padding:20px"><p>Create and score resumes to see performance data</p></div>';
      return;
    }

    el.innerHTML = `
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:1px solid var(--border)">
            <th style="text-align:left;padding:8px 12px;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--text2)">RESUME</th>
            <th style="text-align:left;padding:8px 12px;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--text2)">TEMPLATE</th>
            <th style="text-align:left;padding:8px 12px;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--text2)">LAST MODIFIED</th>
            <th style="text-align:right;padding:8px 12px;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--text2)">ATS SCORE</th>
          </tr>
        </thead>
        <tbody>
          ${resumes.map(r => {
            const score = r.atsScore || 0;
            const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--cyan)' : score > 0 ? 'var(--yellow)' : 'var(--text2)';
            return `
              <tr style="border-bottom:1px solid rgba(0,229,255,0.08);cursor:pointer" onclick="ResumeBuilder.loadResume('${r.id}')">
                <td style="padding:10px 12px;font-size:13px;color:var(--text);font-weight:600">${r.title || 'Untitled'}</td>
                <td style="padding:10px 12px;font-family:'Space Mono',monospace;font-size:10px;color:var(--text2)">${r.template || 'modern'}</td>
                <td style="padding:10px 12px;font-family:'Space Mono',monospace;font-size:10px;color:var(--text2)">${formatDate(r.lastModified)}</td>
                <td style="padding:10px 12px;text-align:right;font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;color:${color}">${score ? score + '%' : '—'}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;
  }
};
