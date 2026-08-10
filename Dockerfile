FROM nginxinc/nginx-unprivileged:1.29.1-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY index.html jogos.html integracoes.html 404.html robots.txt sitemap.xml .nojekyll /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY public /usr/share/nginx/html/public
COPY api /usr/share/nginx/html/api
COPY llms.txt /usr/share/nginx/html/llms.txt

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
