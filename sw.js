/* Ежедневник: service worker — офлайн-кэш + уведомления */
var CACHE = 'ezh-v1';
var ASSETS = ['./', './ежедневник.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(ASSETS).catch(function(){}); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function(hit){
      if(hit) return hit;
      return fetch(e.request).then(function(resp){
        var copy = resp.clone();
        caches.open(CACHE).then(function(c){ try{ c.put(e.request, copy); }catch(err){} });
        return resp;
      }).catch(function(){ return caches.match('./ежедневник.html'); });
    })
  );
});

self.addEventListener('message', function(e){
  var d = e.data || {};
  if(d.type === 'notify' && d.title){
    self.registration.showNotification(d.title, {
      body: d.body || '',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'ezh-' + Date.now(),
      vibrate: [80, 40, 80]
    });
  }
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list){
      for(var i=0;i<list.length;i++){
        var cl = list[i];
        if('focus' in cl) return cl.focus();
      }
      return self.clients.openWindow('./ежедневник.html');
    })
  );
});
