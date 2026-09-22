let map = null;
let markersLayer = null;

const MapApp = {
  init() {
    if (!document.getElementById('map')) return;

    map = L.map('map').setView(BISHKEK_CENTER, DEFAULT_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
  },

  clearMarkers() {
    if (markersLayer) markersLayer.clearLayers();
  },

  addTaskMarker(task) {
    if (!task.pickup_lat || !task.pickup_lng) return;

    const marker = L.marker([task.pickup_lat, task.pickup_lng]);
    const popupHtml = `
      <strong>${task.title}</strong><br>
      <span class="text-green-600 font-bold">${task.reward} сом</span><br>
      <small>Забор: ${task.pickup_address}</small><br>
      <button onclick="Tasks.showDetail('${task.id}')" class="mt-1 text-blue-600 underline text-sm">Подробнее</button>
    `;
    marker.bindPopup(popupHtml);
    markersLayer.addLayer(marker);
  },

  fitToMarkers() {
    // Optional: could fit bounds if many markers
  }
};
