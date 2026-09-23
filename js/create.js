document.addEventListener('DOMContentLoaded', async () => {
  const user = await Auth.getUser();
  if (!user) {
    document.getElementById('login-gate').classList.remove('hidden');
    return;
  }

  document.getElementById('create-box').classList.remove('hidden');

  const profile = await Auth.getProfile();
  if (profile?.telegram_username) {
    document.getElementById('telegram').value = profile.telegram_username.replace(/^@/, '');
  }

  document.getElementById('create-task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('create-status');
    statusEl.textContent = 'Публикуем...';
    statusEl.className = 'mt-3 text-sm text-gray-600';

    const telegram = document.getElementById('telegram').value.replace(/^@/, '').trim();
    if (!telegram) {
      statusEl.textContent = 'Укажи Telegram';
      statusEl.className = 'mt-3 text-sm text-red-600';
      return;
    }

    await supabaseClient
      .from('profiles')
      .update({ telegram_username: telegram })
      .eq('id', user.id);

    const payload = {
      title: document.getElementById('task-title').value.trim(),
      description: document.getElementById('task-desc').value.trim(),
      pickup_address: document.getElementById('pickup-address').value.trim(),
      delivery_address: document.getElementById('delivery-address').value.trim(),
      reward: parseFloat(document.getElementById('task-reward').value),
      created_by: user.id,
      status: 'open'
    };

    const { error } = await supabaseClient.from('tasks').insert(payload);
    if (error) {
      statusEl.textContent = 'Ошибка: ' + error.message;
      statusEl.className = 'mt-3 text-sm text-red-600';
      return;
    }

    statusEl.textContent = 'Задание опубликовано!';
    statusEl.className = 'mt-3 text-sm text-green-600';
    setTimeout(() => window.location.href = 'index.html', 1200);
  });
});
