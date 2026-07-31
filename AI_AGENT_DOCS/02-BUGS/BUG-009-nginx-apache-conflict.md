# BUG-009: Web Server Conflict (Routed Error 404)

## Symptoms
- After running basic server restart commands (e.g., `systemctl restart php-fpm httpd nginx`), the Flutter app starts throwing "Routed Error" or the API endpoints return `404 Route Not Found`.
- Nginx service fails to start or restart. 
- The Nginx error log (`/var/log/nginx/error.log`) shows: `[emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`.

## Root Cause
The server has both `httpd` (Apache) and `nginx` installed. 
By default, the CodeIgniter application relies on **Nginx** as its primary web server or reverse proxy, which contains the specific rewrite rules necessary for routing API endpoints (e.g., rewriting `/admin_api/bulk_create_campaign` to `/index.php`).

If a developer arbitrarily restarts `httpd` along with `nginx`, Apache might start up faster and aggressively bind to port `80`. When Nginx attempts to start a millisecond later, it finds port `80` occupied by Apache, and crashes. 
Consequently, Apache serves the PHP app instead, but because Apache lacks the specific `.htaccess` or virtual host configuration meant for Nginx, it fails to route the requests properly to CodeIgniter, causing `404` errors for API calls.

## Fix / Resolution
Always ensure Nginx holds port 80. Stop Apache completely and restart Nginx:

```bash
systemctl stop httpd
systemctl start nginx
systemctl enable nginx # to ensure it starts on boot
```

## How to Debug Similar Issues in the Future
If the backend suddenly loses its routes or returns 404s after a restart:
1. Check what process is listening on the HTTP ports using:
   `netstat -tulpn | grep :80`
2. If the output shows `httpd` instead of `nginx`, Apache has hijacked the port.
3. Stop Apache and restart Nginx.
