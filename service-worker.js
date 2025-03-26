// نام کش
const CACHE_NAME = 'chatbot-cache-v1';

// فایل‌هایی که باید در کش ذخیره شوند
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/fix-scroll.css',
  '/script.js',
  '/storage.js',
  '/encryption.js',
  '/manifest.json',
  '/assets/images/logo.png',
  '/assets/images/logo-192.png',
  '/assets/images/logo-512.png',
  '/assets/images/favicon.ico',
  'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js'
];

// نصب سرویس ورکر و کش کردن فایل‌ها
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching resources');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// فعال‌سازی سرویس ورکر و پاک کردن کش‌های قدیمی
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => {
      return self.clients.claim();
    })
  );
});

// استراتژی کش: ابتدا کش، سپس شبکه
self.addEventListener('fetch', (event) => {
  // فقط به درخواست‌های GET پاسخ دهید (API درخواست‌ها نباید کش شوند)
  if (event.request.method !== 'GET' || 
      event.request.url.includes('openrouter.ai')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // اگر در کش پیدا شد، بازگرداندن آن
        if (response) {
          return response;
        }
        
        // اگر در کش نبود، از شبکه درخواست کنید
        return fetch(event.request)
          .then((networkResponse) => {
            // کش کردن پاسخ برای استفاده بعدی
            if (networkResponse && networkResponse.status === 200 &&
                networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.log('[ServiceWorker] Fetch failed; returning offline page instead.', error);
            // در صورت خطا در شبکه، صفحه آفلاین نمایش داده شود
            return caches.match('/index.html');
          });
      })
  );
});

// نمایش پیام‌هایتوش (در صورت نیاز)
self.addEventListener('push', (event) => {
  if (event.data) {
    const pushData = JSON.parse(event.data.text());
    const options = {
      body: pushData.body || 'پیام جدید',
      icon: '/assets/images/logo-192.png',
      badge: '/assets/images/logo-96.png',
      dir: 'rtl',
      vibrate: [100, 50, 100],
      data: {
        url: pushData.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(pushData.title || 'چت بات هوشمند', options)
    );
  }
});

// اقدام بر اساس کلیک بر روی نوتیفیکیشن
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
}); 