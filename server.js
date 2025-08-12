// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const plugin = require('./http3-min-secure');

const app = express();
const PUBLIC = path.join(__dirname, 'public');

(async function start() {
  // 1) Build cache at startup
  console.log('Building minified cache...');
  const cache = await plugin.buildCache(PUBLIC);
  plugin.attachWatcher(PUBLIC, cache);
  console.log(`Cached ${cache.size} files.`);

  // 2) Enforce that requests arrived via an HTTPS reverse proxy (Caddy)
  app.use(plugin.forceHTTPSOnly);

  // 3) Serve cached assets (serves / -> /index.html)
  app.use(plugin.cacheMiddleware(cache, PUBLIC));

  // 4) Fallback static serving (if not in cache)
  app.use(express.static(PUBLIC));

  // 5) 404
  app.use((req, res) => res.status(404).send('Not found'));

  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
