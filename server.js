const express = require('express');
const path = require('path');
const plugin = require('./http3-min-secure');
const fs = require('fs');
const { minify: minifyHTML } = require('html-minifier-terser');

const app = express();
const PUBLIC = path.join(__dirname, 'public');

// 1. Enforce HTTP/3 or HTTPS on incoming requests
app.use(plugin.forceHTTP3);

// 2. Explicitly handle root URL, serve minified index.html with anti-debug script
app.get('/', async (req, res) => {
    try {
        const indexPath = path.join(PUBLIC, 'index.html');
        const rawHtml = await fs.promises.readFile(indexPath, 'utf8');
        const minifiedHtml = await minifyHTML(rawHtml, {
            removeComments: true,
            collapseWhitespace: true,
            collapseInlineTagWhitespace: true,
            minifyCSS: true,
            minifyJS: true,
            removeAttributeQuotes: true,
            useShortDoctype: true,
        });
        res.type('html').send(minifiedHtml + `
<script>
(function(){
    document.addEventListener('keydown', function(e){
        if(
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && ['I','C','J'].includes(e.key)) ||
            (e.ctrlKey && e.key === 'U')
        ){
            e.preventDefault(); return false;
        }
    });
    setInterval(function(){
        if(window.outerWidth - window.innerWidth > 100 || window.outerHeight - window.innerHeight > 100){
            document.body.innerHTML = '<h1>DevTools Disabled</h1>';
        }
    }, 1000);
})();
</script>
`);
    } catch (err) {
        res.status(500).send('Error loading index.html');
    }
});

// 3. Minify JS, CSS, and other HTML (other than root handled already)
app.use(plugin.minifyMiddleware(PUBLIC));

// 4. Serve other static assets like images
app.use((req, res, next) => {
    const ext = path.extname(req.path);
    if (!['.js', '.css', '.html'].includes(ext)) {
        express.static(PUBLIC)(req, res, next);
    } else {
        next();
    }
});

// 5. Catch-all 404 handler
app.use((req, res) => res.status(404).send('Not found'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
