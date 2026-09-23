const Auth = {
  async getSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
  },

  async getUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
  },

  async getProfile() {
    const user = await this.getUser();
    if (!user) return null;
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) {
      console.error('Profile error', error);
      return null;
    }
    return data;
  },

  async signUp(email, password, meta = {}) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: meta
      }
    });
    if (error) throw error;
    return data;
  },

  async signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  },

  async isAdmin() {
    const profile = await this.getProfile();
    return profile && profile.role === 'admin';
  },

  async updateNav() {
    const nav = document.getElementById('nav-auth');
    if (!nav) return;

    const session = await this.getSession();
    if (session) {
      const profile = await this.getProfile();
      const name = profile?.username || profile?.full_name || session.user.email;
      let html = `<a href="create.html" class="bg-white text-blue-600 px-3 py-1 rounded font-medium text-sm">+ Задание</a>`;
      html += `<span class="text-sm hidden sm:inline">Привет, ${name}</span>`;
      if (profile?.role === 'admin') {
        html += `<a href="admin.html" class="bg-white/20 px-3 py-1 rounded hover:bg-white/30 text-sm">Админ</a>`;
      }
      html += `<button id="btn-logout" class="bg-white/20 px-3 py-1 rounded hover:bg-white/30 text-sm">Выйти</button>`;
      nav.innerHTML = html;
      document.getElementById('btn-logout')?.addEventListener('click', async () => {
        await this.signOut();
        window.location.href = 'index.html';
      });
    } else {
      nav.innerHTML = `
        <a href="login.html" class="hover:underline text-sm">Вход</a>
        <a href="signup.html" class="bg-white text-blue-600 px-3 py-1 rounded font-medium text-sm hover:bg-gray-100">Регистрация</a>
      `;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Auth.updateNav();
});
