/* ===== PDFEXPORT.JS — PDF Download ===== */

const PdfExport = {
  async download() {
    const docEl = document.getElementById('resumeDoc');
    if (!docEl) return toast('Open a resume in the Builder first', 'error');

    const name = ResumeBuilder.data.personalInfo?.name || 'resume';
    const filename = `${name.toLowerCase().replace(/\s+/g, '_')}_resume.pdf`;

    showLoader('GENERATING PDF...');
    try {
      await html2pdf().set({
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(docEl).save();

      AppFS.incrementAnalytic('downloads');
      hideLoader();
      toast('PDF downloaded successfully', 'success');
    } catch (err) {
      hideLoader();
      toast('PDF export failed: ' + err.message, 'error');
    }
  },

  async downloadById(id) {
    const resume = AppState.resumes.find(r => r.id === id);
    if (!resume) return toast('Resume not found', 'error');

    // Render to a hidden element
    const temp = document.createElement('div');
    temp.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1';
    document.body.appendChild(temp);

    // Temporarily load into builder to render
    const prev = JSON.parse(JSON.stringify(ResumeBuilder.data));
    ResumeBuilder.data = JSON.parse(JSON.stringify(resume));
    ResumeBuilder.renderPreview();

    setTimeout(async () => {
      await this.download();
      // Restore
      ResumeBuilder.data = prev;
      ResumeBuilder.renderPreview();
      document.body.removeChild(temp);
    }, 300);
  }
};
