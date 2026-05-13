/* ===== FIRESTORE.JS — Save/Load Resumes & Analytics ===== */

const AppFS = {
  async loadUserData() {
    const uid = AppState.user.uid;
    try {
      // Load resumes
      const snap = await db.collection('users').doc(uid).collection('resumes').orderBy('lastModified', 'desc').get();
      AppState.resumes = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Load analytics meta
      const metaSnap = await db.collection('users').doc(uid).get();
      if (metaSnap.exists) {
        AppState.analyticsData = metaSnap.data().analytics || { downloads: 0, aiAssists: 0 };
      }

      document.getElementById('resumeCountBadge').textContent = AppState.resumes.length;
      App.refreshDashboard();
    } catch (err) {
      toast('Failed to load data: ' + err.message, 'error');
    }
  },

  async saveResume(resumeData) {
    const uid = AppState.user.uid;
    try {
      resumeData.lastModified = firebase.firestore.FieldValue.serverTimestamp();
      resumeData.userId = uid;

      let docRef;
      if (resumeData.id) {
        docRef = db.collection('users').doc(uid).collection('resumes').doc(resumeData.id);
        await docRef.update(resumeData);
      } else {
        docRef = await db.collection('users').doc(uid).collection('resumes').add(resumeData);
        resumeData.id = docRef.id;
      }

      // Update local state
      const idx = AppState.resumes.findIndex(r => r.id === resumeData.id);
      if (idx >= 0) {
        AppState.resumes[idx] = { ...resumeData };
      } else {
        AppState.resumes.unshift({ ...resumeData });
      }

      document.getElementById('resumeCountBadge').textContent = AppState.resumes.length;
      document.getElementById('builderSaveStatus').textContent = 'Saved ✓';
      setTimeout(() => {
        document.getElementById('builderSaveStatus').textContent = 'Auto-save on';
      }, 2000);

      return resumeData.id;
    } catch (err) {
      toast('Save failed: ' + err.message, 'error');
      throw err;
    }
  },

  async deleteResume(id) {
    if (!confirm('Delete this resume permanently?')) return;
    const uid = AppState.user.uid;
    try {
      await db.collection('users').doc(uid).collection('resumes').doc(id).delete();
      AppState.resumes = AppState.resumes.filter(r => r.id !== id);
      document.getElementById('resumeCountBadge').textContent = AppState.resumes.length;
      App.refreshResumeList();
      App.refreshDashboard();
      toast('Resume deleted', 'success');
    } catch (err) {
      toast('Delete failed: ' + err.message, 'error');
    }
  },

  async incrementAnalytic(key) {
    const uid = AppState.user.uid;
    try {
      await db.collection('users').doc(uid).set({
        analytics: { [key]: firebase.firestore.FieldValue.increment(1) }
      }, { merge: true });
      if (!AppState.analyticsData) AppState.analyticsData = {};
      AppState.analyticsData[key] = (AppState.analyticsData[key] || 0) + 1;
    } catch (_) {}
  },

  async logScoreHistory(resumeId, score) {
    const uid = AppState.user.uid;
    try {
      await db.collection('users').doc(uid).collection('scoreHistory').add({
        resumeId,
        score,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (_) {}
  },

  async getScoreHistory() {
    const uid = AppState.user.uid;
    try {
      const snap = await db.collection('users').doc(uid).collection('scoreHistory')
        .orderBy('timestamp', 'desc').limit(20).get();
      return snap.docs.map(d => d.data());
    } catch (_) {
      return [];
    }
  }
};
