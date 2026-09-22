document.addEventListener('DOMContentLoaded', async () => {
  // Init map
  MapApp.init();

  // Modal close
  document.getElementById('modal-close')?.addEventListener('click', () => {
    document.getElementById('task-modal').classList.add('hidden');
  });
  document.getElementById('task-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'task-modal') e.target.classList.add('hidden');
  });

  // Upload modal
  document.getElementById('upload-cancel')?.addEventListener('click', () => {
    document.getElementById('upload-modal').classList.add('hidden');
  });
  document.getElementById('upload-submit')?.addEventListener('click', () => Tasks.uploadPhoto());

  // Refresh button
  document.getElementById('btn-refresh')?.addEventListener('click', () => Tasks.refresh());

  // Load data
  await Tasks.refresh();
});
