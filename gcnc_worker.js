var cacheName = 'gcnc_pwa_v1_6';

var filesToCache =
[
  './',
  './index.html',
  './code/cncsvgparser_v_1_6.js',
  './code/gcodercnc_v_1_6.js',
  './code/gcodercnc_v_1_6.css',
  './code/cncvariables_v_1_6.js',
  './code/cncstorage_v_1_6.js',
  './code/cncgcode_v_1_6.js',
  './libraries/popper.min.js',
  './libraries/jquery.min.js',
  './libraries/bootstrap.min.js',
  './libraries/bootstrap.min.css',
  './libraries/FileSaver.min.js',
  './images/th_humptyegg.png',
  './images/th_happyface.png',
  './images/th_flowervcarve.png',
  './images/th_dragonplaque.png',
  './images/th_dollshousecrate.png',
  './images/th_darthvaderhead.png',
  './images/th_cncshopsign.png'
];

self.addEventListener('install', function(e)
{
  e.waitUntil(
    caches.open(cacheName).then(function(cache)
    {
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('fetch', function(e)
{
  e.respondWith(
    caches.match(e.request).then(function(response)
    {
      return response || fetch(e.request);
    })
  );
});

self.addEventListener('activate', function(e)
{
  e.waitUntil(
    caches.keys().then((keyList) =>
    {
      return Promise.all(keyList.map((key) =>
      {
        if (key !== cacheName)
        {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
});
