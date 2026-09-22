document.addEventListener('DOMContentLoaded', async () => {
  const isAdmin = await Auth.isAdmin();
  if (!isAdmin) {
    document.getElementById('admin-gate').classList.remove('hidden');
    return;
  }
  document.getElementById('admin-content').classList.remove('hidden');

  // Create task form
  document.getElementById('create-task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('create-status');
    statusEl.textContent = 'Создание...';
    statusEl.className = 'mt-3 text-sm text-gray-600';

    const user = await Auth.getUser();
    const payload = {
      title: document.getElementById('task-title').value,
      description: document.getElementById('task-desc').value,
      pickup_address: document.getElementById('pickup-address').value,
      delivery_address: document.getElementById('delivery-address').value,
      pickup_lat: parseFloat(document.getElementById('pickup-lat').value) || null,
      pickup_lng: parseFloat(document.getElementById('pickup-lng').value) || null,
      delivery_lat: parseFloat(document.getElementById('delivery-lat').value) || null,
      delivery_lng: parseFloat(document.getElementById('delivery-lng').value) || null,
      reward: parseFloat(document.getElementById('task-reward').value),
      created_by: user.id,
      status: 'open'
    };

    const { error } = await supabase.from('tasks').insert(payload);
    if (error) {
      statusEl.textContent = 'Ошибка: ' + error.message;
      statusEl.className = 'mt-3 text-sm text-red-600';
      return;
    }

    statusEl.textContent = 'Задание успешно создано!';
    statusEl.className = 'mt-3 text-sm text-green-600';
    e.target.reset();
    document.getElementById('task-reward').value = 200;
    loadAdminTasks();
  });

  async function loadAdminTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, profiles:claimed_by(username, full_name)')
      .order('created_at', { ascending: false });

    const container = document.getElementById('admin-tasks-list');
    if (error) {
      container.innerHTML = '<p class="text-red-500">Ошибка загрузки</p>';
      return;
    }

    if (!data.length) {
      container.innerHTML = '<p class="text-gray-400">Нет заданий</p>';
      return;
    }

    container.innerHTML = data.map(t => {
      const claimer = t.profiles ? (t.profiles.username || t.profiles.full_name || '—') : '—';
      let actions = '';
      if (t.status === 'completed') {
        actions = `
          <button onclick="markPaid('${t.id}')" class="bg-green-600 text-white text-sm px-3 py-1 rounded hover:bg-green-700">Отметить оплаченным</button>
        `;
      } else if (t.status === 'claimed') {
        actions = `<span class="text-yellow-600 text-sm">В работе у ${claimer}</span>`;
      }

      return `
        <div class="border rounded-lg p-4">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-semibold">${t.title} <span class="text-sm font-normal text-gray-500">(${t.status})</span></h3>
              <p class="text-sm text-gray-600">${t.pickup_address} → ${t.delivery_address}</p>
              <p class="text-green-600 font-bold">${t.reward} сом</p>
              ${t.claimed_by ? `<p class="text-sm">Исполнитель: ${claimer}</p>` : ''}
              ${t.photo_url ? `<a href="${t.photo_url}" target="_blank" class="text-blue-600 text-sm">Фото</a>` : ''}
            </div>
            <div class="text-right">
              ${actions}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window.markPaid = async (id) => {
    if (!confirm('Отметить как оплаченное?')) return;
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'paid' })
      .eq('id', id);
    if (error) alert(error.message);
    else loadAdminTasks();
  };

  loadAdminTasks();
});
