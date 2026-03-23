const CACHE_NAME = 'lifeos-v1';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// Notification scheduling
const scheduledNotifications = new Map();

self.addEventListener('message', e => {
  if (e.data.type === 'SCHEDULE_NOTIFICATION') {
    const task = e.data.task;
    scheduleTaskNotification(task);
  }
});

function scheduleTaskNotification(task) {
  const [h, m] = task.startTime.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  const delay = target - now;
  setTimeout(() => {
    self.registration.showNotification(task.name, {
      body: task.content || 'タスクの時間です',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'task-' + task.id,
      data: { taskId: task.id }
    });
    // reschedule for next day if recurring
    if (task.noEnd || task.startDate !== task.endDate) {
      setTimeout(() => scheduleTaskNotification(task), 1000);
    }
  }, delay);
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./index.html'));
});

// Waste notification at midnight
self.addEventListener('message', e => {
  if(e.data.type === 'SCHEDULE_WASTE_NOTIFICATION'){
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const delay = midnight - now;
    setTimeout(() => {
      self.registration.showNotification('今日の浪費を記録しよう', {
        body: '惰眠・ゲーム・漫画・SNSの時間を振り返る',
        icon: './icon-192.png',
        tag: 'waste-daily',
      });
      // reschedule for next day
      setTimeout(() => {
        self.clients.matchAll().then(clients => {
          clients.forEach(c => c.postMessage({type:'SCHEDULE_WASTE_NOTIFICATION'}));
        });
      }, 1000);
    }, delay);
  }
});
