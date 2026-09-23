const Tasks = {
  currentTaskId: null,

  async loadOpenTasks() {
    const { data, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      document.getElementById('tasks-list').innerHTML = '<div class="p-4 text-red-500">Ошибка загрузки заданий</div>';
      return [];
    }
    return data || [];
  },

  async loadMyTasks() {
    const user = await Auth.getUser();
    if (!user) return [];

    const { data, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .or(`claimed_by.eq.${user.id},created_by.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  },

  renderList(tasks) {
    const container = document.getElementById('tasks-list');
    if (!tasks.length) {
      container.innerHTML = '<div class="p-6 text-center text-gray-400">Пока нет открытых заданий</div>';
      return;
    }

    container.innerHTML = tasks.map(t => `
      <div class="p-4 hover:bg-gray-50 cursor-pointer transition" onclick="Tasks.showDetail('${t.id}')">
        <div class="flex justify-between items-start">
          <h3 class="font-semibold text-gray-800">${t.title}</h3>
          <span class="bg-green-100 text-green-800 text-sm font-bold px-2 py-0.5 rounded">${t.reward} сом</span>
        </div>
        <p class="text-sm text-gray-500 mt-1 truncate">${t.pickup_address} → ${t.delivery_address}</p>
      </div>
    `).join('');
  },

  renderMyTasks(tasks) {
    const section = document.getElementById('my-tasks-section');
    const list = document.getElementById('my-tasks-list');
    if (!section || !list) return;

    if (!tasks.length) {
      section.classList.add('hidden');
      return;
    }
    section.classList.remove('hidden');
    const userId = window.__currentUserId || null;

    list.innerHTML = tasks.map(t => {
      const isOwner = userId && t.created_by === userId;
      const isWorker = userId && t.claimed_by === userId;
      let statusBadge = '';
      let actions = '';
      if (t.status === 'claimed' && isWorker) {
        statusBadge = '<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">В работе</span>';
        actions = `<button onclick="Tasks.openUpload('${t.id}')" class="mt-2 bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700">Загрузить фото</button>`;
      } else if (t.status === 'claimed' && isOwner) {
        statusBadge = '<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Исполнитель работает</span>';
      } else if (t.status === 'completed' && isWorker) {
        statusBadge = '<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Ждёт оплаты</span>';
        actions = `<p class="mt-2 text-sm text-gray-600">Напиши заказчику реквизиты в Telegram.</p>`;
      } else if (t.status === 'completed' && isOwner) {
        statusBadge = '<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Нужно оплатить</span>';
        actions = `<button onclick="Tasks.markPaid('${t.id}')" class="mt-2 bg-green-600 text-white text-sm px-3 py-1 rounded hover:bg-green-700">Я оплатил</button>`;
      } else if (t.status === 'paid') {
        statusBadge = '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Оплачено</span>';
      } else if (t.status === 'open' && isOwner) {
        statusBadge = '<span class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Моё объявление</span>';
      }

      return `
        <div class="bg-white rounded-xl shadow p-4">
          <div class="flex justify-between">
            <h3 class="font-semibold">${t.title}</h3>
            ${statusBadge}
          </div>
          <p class="text-sm text-gray-500 mt-1">${t.pickup_address} → ${t.delivery_address}</p>
          <p class="text-green-600 font-bold mt-1">${t.reward} сом</p>
          ${actions}
          ${t.photo_url ? `<img src="${t.photo_url}" class="mt-2 rounded max-h-32 object-cover" alt="proof">` : ''}
        </div>
      `;
    }).join('');
  },

  async showDetail(taskId) {
    const { data: task, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error || !task) {
      alert('Задание не найдено');
      return;
    }

    this.currentTaskId = taskId;
    const modal = document.getElementById('task-modal');
    document.getElementById('modal-title').textContent = task.title;

    let bodyHtml = `
      <p><strong>Описание:</strong> ${task.description || '—'}</p>
      <p><strong>Забор:</strong> ${task.pickup_address}</p>
      <p><strong>Доставка:</strong> ${task.delivery_address}</p>
      <p><strong>Оплата:</strong> <span class="text-green-600 font-bold text-lg">${task.reward} сом</span></p>
      <p><strong>Статус:</strong> ${task.status}</p>
    `;

    if (task.photo_url) {
      bodyHtml += `<img src="${task.photo_url}" class="rounded mt-2 max-h-48" alt="photo">`;
    }

    document.getElementById('modal-body').innerHTML = bodyHtml;

    const actions = document.getElementById('modal-actions');
    const user = await Auth.getUser();
    let actionsHtml = '';

    if (task.status === 'open' && user && task.created_by === user.id) {
      actionsHtml = `<p class="text-sm text-gray-500">Это твоё объявление.</p>`;
    } else if (task.status === 'open' && user) {
      actionsHtml = `<button onclick="Tasks.claimTask('${task.id}')" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Взять задание</button>`;
    } else if (task.status === 'open' && !user) {
      actionsHtml = `<a href="login.html" class="bg-blue-600 text-white px-4 py-2 rounded-lg">Войдите чтобы взять</a>`;
    } else if (task.status === 'claimed' && user && task.claimed_by === user.id) {
      actionsHtml = `<button onclick="Tasks.openUpload('${task.id}')" class="bg-green-600 text-white px-4 py-2 rounded-lg">Загрузить фото выполнения</button>`;
    } else if (task.status === 'completed' && user && task.claimed_by === user.id) {
      const { data: owner } = await supabaseClient.from('profiles').select('telegram_username').eq('id', task.created_by).single();
      const tg = owner?.telegram_username ? owner.telegram_username.replace(/^@/, '') : '';
      actionsHtml = tg
        ? `<a href="https://t.me/${tg}" target="_blank" class="inline-block bg-blue-500 text-white px-4 py-2 rounded-lg">Написать заказчику @${tg}</a>`
        : `<p class="text-sm">Telegram заказчика пока не указан</p>`;
    } else if (task.status === 'completed' && user && task.created_by === user.id) {
      const { data: worker } = await supabaseClient.from('profiles').select('telegram_username').eq('id', task.claimed_by).single();
      const tg = worker?.telegram_username ? worker.telegram_username.replace(/^@/, '') : '';
      actionsHtml = `
        ${tg ? `<a href="https://t.me/${tg}" target="_blank" class="inline-block bg-blue-500 text-white px-4 py-2 rounded-lg">Написать исполнителю @${tg}</a>` : ''}
        <button onclick="Tasks.markPaid('${task.id}')" class="bg-green-600 text-white px-4 py-2 rounded-lg">Я оплатил</button>
      `;
    }

    actions.innerHTML = actionsHtml;
    modal.classList.remove('hidden');
  },

  async claimTask(taskId) {
    const user = await Auth.getUser();
    if (!user) {
      alert('Сначала войдите');
      return;
    }

    const { error } = await supabaseClient
      .from('tasks')
      .update({
        status: 'claimed',
        claimed_by: user.id,
        claimed_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('status', 'open');

    if (error) {
      alert('Не удалось взять задание: ' + error.message);
      return;
    }

    alert('Задание успешно взято! Выполните и загрузите фото.');
    document.getElementById('task-modal').classList.add('hidden');
    this.refresh();
  },

  openUpload(taskId) {
    this.currentTaskId = taskId;
    document.getElementById('upload-modal').classList.remove('hidden');
    document.getElementById('photo-input').value = '';
    document.getElementById('upload-status').textContent = '';
  },

  async uploadPhoto() {
    const fileInput = document.getElementById('photo-input');
    const statusEl = document.getElementById('upload-status');
    const file = fileInput.files[0];
    if (!file) {
      statusEl.textContent = 'Выберите фото';
      return;
    }

    statusEl.textContent = 'Загрузка...';
    const user = await Auth.getUser();
    const fileName = `${user.id}/${this.currentTaskId}_${Date.now()}.jpg`;

    const { error: uploadError } = await supabaseClient.storage
      .from('task-photos')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      statusEl.textContent = 'Ошибка загрузки: ' + uploadError.message;
      return;
    }

    const { data: { publicUrl } } = supabaseClient.storage
      .from('task-photos')
      .getPublicUrl(fileName);

    const { error: updateError } = await supabaseClient
      .from('tasks')
      .update({
        status: 'completed',
        photo_url: publicUrl,
        completed_at: new Date().toISOString()
      })
      .eq('id', this.currentTaskId)
      .eq('claimed_by', user.id);

    if (updateError) {
      statusEl.textContent = 'Ошибка обновления: ' + updateError.message;
      return;
    }

    statusEl.textContent = 'Готово! Напиши заказчику в Telegram реквизиты для оплаты.';
    setTimeout(() => {
      document.getElementById('upload-modal').classList.add('hidden');
      this.refresh();
    }, 1500);
  },

  async markPaid(taskId) {
    if (!confirm('Подтвердить, что ты уже оплатил исполнителю?')) return;
    const { error } = await supabaseClient
      .from('tasks')
      .update({ status: 'paid' })
      .eq('id', taskId);
    if (error) {
      alert(error.message);
      return;
    }
    this.refresh();
  },

  async refresh() {
    try {
      const user = await Auth.getUser();
      window.__currentUserId = user ? user.id : null;

      const openTasks = await this.loadOpenTasks();
      this.renderList(openTasks);

      if (typeof MapApp !== 'undefined') {
        MapApp.clearMarkers();
        openTasks.forEach(t => MapApp.addTaskMarker(t));
      }

      const myTasks = await this.loadMyTasks();
      this.renderMyTasks(myTasks);
    } catch (e) {
      console.error(e);
      const el = document.getElementById('tasks-list');
      if (el) el.innerHTML = '<div class="p-4 text-red-500">Ошибка: ' + e.message + '</div>';
    }
  }
};
