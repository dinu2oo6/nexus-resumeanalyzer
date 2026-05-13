/* ===== AUTH.JS — Firebase Authentication ===== */

const AppAuth = {
  init() {
    auth.onAuthStateChanged(user => {
      if (!user) {
        window.location.href = 'login.html';
        return;
      }
      AppState.user = user;
      this.updateUI(user);
      AppFS.loadUserData();
    });
  },

  updateUI(user) {
    const name = user.displayName || user.email.split('@')[0];
    const initial = name.charAt(0).toUpperCase();

    document.getElementById('userName').textContent = name;
    document.getElementById('userAvatar').textContent = initial;
  },

  async logout() {
    try {
      await auth.signOut();
      window.location.href = 'login.html';
    } catch (err) {
      toast('Logout failed: ' + err.message, 'error');
    }
  }
};

AppAuth.init();
