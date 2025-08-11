const { minify: minifyHTML } = require('html-minifier-terser');
const UglifyJS = require('uglify-js');
const CleanCSS = require('clean-css');
const fs = require('fs');
const path = require('path');

// Force HTTP/3 or HTTPS protocol enforcement middleware
function forceHTTP3(req, res, next) {
    const proto = req.headers['x-forwarded-proto'] || '';
    if (proto === 'https' || proto === 'h3') {
        next();
    } else {
        res.status(426).send('HTTP/3 required. Please use a browser that supports HTTP/3.');
    }
}

// Minification middleware for JS, CSS, HTML files
function minifyMiddleware(publicDir) {
    return async function(req, res, next) {
        const url = req.path;

        function sendMinified(filePath, type, minifierFn) {
            fs.readFile(filePath, 'utf8', async (err, data) => {
                if (err) return next();
                let minified;
                try {
                    minified = await minifierFn(data);
                } catch (e) {
                    return next();
                }
                res.type(type).send(minified);
            });
        }

        if (url.endsWith('.js')) {
            sendMinified(
                path.join(publicDir, url),
                'application/javascript',
                data => {
                    const result = UglifyJS.minify(data);
                    if (result.error) throw result.error;
                    return result.code;
                }
            );
        } else if (url.endsWith('.css')) {
            sendMinified(
                path.join(publicDir, url),
                'text/css',
                data => new CleanCSS().minify(data).styles
            );
        } else if (url.endsWith('.html')) {
            sendMinified(
                path.join(publicDir, url),
                'text/html',
                async data => {
                    const minified = await minifyHTML(data, {
                        removeComments: true,
                        collapseWhitespace: true,
                        collapseInlineTagWhitespace: true,
                        minifyCSS: true,
                        minifyJS: true,
                        removeAttributeQuotes: true,
                        useShortDoctype: true,
                    });
                    return injectAntiDebugScript(minified);
                }
            );
        } else {
            next();
        }
    };
}

// Anti-debug JavaScript injection into HTML pages
function injectAntiDebugScript(htmlContent) {
    const antiDebugScript = `
<script>
(function(){
    document.addEventListener('keydown', function(e){
        if(
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && ['I','C','J'].includes(e.key)) ||
            (e.ctrlKey && e.key === 'U')
        ){
            e.preventDefault();
            return false;
        }
    });
    setInterval(function(){
        if(window.outerWidth - window.innerWidth > 100 || window.outerHeight - window.innerHeight > 100){
            document.body.innerHTML = '<h1>DevTools Disabled</h1>';
        }
    }, 1000);
})();
</script>
`;
    if (htmlContent.includes('</body>')) {
        return htmlContent.replace('</body>', antiDebugScript + '</body>');
    }
    return htmlContent + antiDebugScript;
}

module.exports = {
    forceHTTP3,
    minifyMiddleware
};
