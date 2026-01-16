// Service Worker для офлайн-режима и оптимизации
const CACHE_NAME = 'ice-battle-v2.0.1';
const ASSETS_TO_CACHE = [
    // Основные файлы
    '/',
    '/index.html',
    '/game.html',
    '/404.html',
    
    // Стили
    '/styles/main.css',
    '/styles/animations.css',
    '/styles/ui.css',
    '/styles/mobile.css',
    '/styles/desktop.css',
    '/styles/console.css',
    
    // Скрипты ядра
    '/src/core/Platform.js',
    '/src/core/GameEngine.js',
    '/src/core/Config.js',
    '/src/core/Logger.js',
    '/src/core/Performance.js',
    
    // Критические ресурсы
    '/assets/icons/favicon.ico',
    '/assets/sprites/characters/player.png',
    '/assets/sprites/enemies/seal.png',
    
    // Манифест
    '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Кэширование критических ресурсов...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Активация и очистка старых кэшей
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Удаление старого кэша:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Обработка запросов
self.addEventListener('fetch', event => {
    // Пропускаем запросы к API и аналитике
    if (event.request.url.includes('/api/') || 
        event.request.url.includes('analytics')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Возвращаем из кэша если есть
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Иначе загружаем из сети
                return fetch(event.request)
                    .then(response => {
                        // Не кэшируем ошибки
                        if (!response || response.status !== 200) {
                            return response;
                        }
                        
                        // Клонируем response для кэширования
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Для HTML страниц показываем офлайн-страницу
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/offline.html');
                        }
                        
                        // Для изображений показываем placeholder
                        if (event.request.headers.get('accept').includes('image')) {
                            return caches.match('/assets/placeholder.png');
                        }
                    });
            })
    );
});

// Фоновая синхронизация
self.addEventListener('sync', event => {
    if (event.tag === 'sync-saves') {
        event.waitUntil(syncGameSaves());
    }
});

// Пуш-уведомления
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Новое уведомление от игры!',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('Битва за Льдину', options)
    );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then(clientList => {
                for (const client of clientList) {
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

// Функции помощники
async function syncGameSaves() {
    // Синхронизация сохранений игры
    const saves = await getLocalSaves();
    
    for (const save of saves) {
        try {
            await sendSaveToServer(save);
            await markSaveAsSynced(save.id);
        } catch (error) {
            console.error('Ошибка синхронизации:', error);
        }
    }
}

async function getLocalSaves() {
    // Получение локальных сохранений
    return new Promise(resolve => {
        if ('indexedDB' in window) {
            // Используем IndexedDB
            const request = indexedDB.open('GameSaves', 1);
            request.onsuccess = event => {
                const db = event.target.result;
                const transaction = db.transaction(['saves'], 'readonly');
                const store = transaction.objectStore('saves');
                const getAllRequest = store.getAll();
                
                getAllRequest.onsuccess = () => {
                    resolve(getAllRequest.result);
                };
            };
        } else {
            // Используем localStorage
            const saves = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('save_')) {
                    saves.push(JSON.parse(localStorage.getItem(key)));
                }
            }
            resolve(saves);
        }
    });
}

async function sendSaveToServer(save) {
    // Отправка сохранения на сервер
    return fetch('/api/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(save)
    });
}

async function markSaveAsSynced(saveId) {
    // Помечаем сохранение как синхронизированное
    return new Promise(resolve => {
        if ('indexedDB' in window) {
            const request = indexedDB.open('GameSaves', 1);
            request.onsuccess = event => {
                const db = event.target.result;
                const transaction = db.transaction(['saves'], 'readwrite');
                const store = transaction.objectStore('saves');
                
                const getRequest = store.get(saveId);
                getRequest.onsuccess = () => {
                    const save = getRequest.result;
                    save.synced = true;
                    store.put(save);
                    resolve();
                };
            };
        } else {
            const key = `save_${saveId}`;
            const save = JSON.parse(localStorage.getItem(key));
            save.synced = true;
            localStorage.setItem(key, JSON.stringify(save));
            resolve();
        }
    });
}

// Периодическая синхронизация (каждые 24 часа)
async function periodicSync() {
    const registration = await self.registration;
    if ('periodicSync' in registration) {
        try {
            await registration.periodicSync.register('daily-sync', {
                minInterval: 24 * 60 * 60 * 1000 // 24 часа
            });
            console.log('Периодическая синхронизация зарегистрирована');
        } catch (error) {
            console.log('Периодическая синхронизация не поддерживается:', error);
        }
    }
}

// Запуск периодической синхронизации при активации
self.addEventListener('activate', event => {
    event.waitUntil(periodicSync());
});