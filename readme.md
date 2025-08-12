
A secure, HTTP/3-capable static file server built with Node.js and Caddy, featuring automatic minification and robust anti-debug protections (blocks DevTools, right-click, selection, copy, etc.).

---

## 🔧 Features

* ✅ HTTP/3 (via Caddy reverse proxy)
* ✅ HTML, JS, CSS minification
* ✅ Anti-debug protection:

  * Blocks F12, Ctrl+Shift+I/C/J
  * Ctrl+U was left intact to check the minification results
  * Disables right-click

---

## 📁 Project Structure

```
alldrin2612-plugin/
├── Caddyfile                # Reverse proxy config for HTTP/3
├── http3-min-secure.js     # Plugin with minification + anti-debug logic
├── package.json            # Node.js dependencies
├── server.js               # Express server with plugin integration
└── public/                 # Static assets
    ├── index.html
    ├── main.js
    └── styles.css
```

---

## 🚀 How to Run

### 1. Install Requirements

* Node.js v16+
* Caddy ([https://caddyserver.com/download](https://caddyserver.com/download))

### 2. Install Dependencies

From the project root:

```bash
npm install
```

### 3. Start the Node Server

```bash
node server.js
```

This starts the app on [http://localhost:8080](http://localhost:8080).
The above starts the Node server but it is not on http3 support, You will get status code 426 'HTTPS (via HTTP/3) required.'aka it runs on http1 so for that to we need a reverse proxy server like Caddy.


### 4. Run Caddy for HTTP/3 Support

Caddy reverse proxies to the Node server and enables HTTPS/HTTP/3.

Edit Caddyfile if needed:

```caddyfile
localhost:443 {
reverse_proxy localhost:8080 {
header_up x-forwarded-proto {scheme}
}
}
```

Then run Caddy (from PowerShell or Command Prompt):

```bash
caddy run
```
Then go to https://localhost/ to see the app running on HTTPS/HTTP/3.

---

## 🧪 How to Test

### ✅ Minification

* View Source (Ctrl+U): HTML should be one line
* Open browser → Right-click → Inspect → Check Network tab:

  * index.html, main.js, styles.css should be minified (smaller, no whitespace)

### ✅ Anti-Debug Protection

Try:

* Right-click → Blocked
* F12 / Ctrl+Shift+I → Blocked
* Selecting or copying text → Blocked


### ✅ Check HTTP/3 (no DevTools needed)

Option 1 — Use NetLog:

1. Close all Chrome windows

2. Open PowerShell:

   ```bash
   chrome.exe --log-net-log="C:\Users\YourUser\Desktop\netlog.json"
   ```

3. Visit [https://localhost:8443](https://localhost:8443)

4. Close Chrome

5. Open [https://netlog-viewer.apps.chrome/](https://netlog-viewer.apps.chrome/)

6. Load netlog.json → Check for h3 or quic protocol

Option 2 — Enable Logging in Caddy

Caddyfile already includes:

```caddyfile
log {
  output stdout
  format console
}
```

Check the terminal output — look for h3 in logs:

```
GET /index.html 200 h3
```


