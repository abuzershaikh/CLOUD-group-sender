# Server Timezone and 12-Hour Format Guide

This document explains how to handle timezone inconsistencies and time formatting across the 3 layers of this application (Linux System, PHP Core, and CodeIgniter Framework).

## 1. Setting the Correct Timezone
If the Flutter App shows incorrect time (e.g. 12:00 UTC instead of 18:00 IST), you must synchronize the timezone across all three environments:

### A. Linux System Timezone
Check the current timezone:
```bash
date && timedatectl
```
If it says UTC, change it to Indian Standard Time (IST):
```bash
timedatectl set-timezone Asia/Kolkata
```

### B. PHP Core Timezone
Check the current PHP timezone:
```bash
php -i | grep date.timezone
```
If it is empty or UTC, edit the global `php.ini` file (e.g., `/etc/php.ini`):
```ini
date.timezone = Asia/Kolkata
```
After editing, you **MUST** restart the PHP FPM service:
```bash
systemctl restart php-fpm
systemctl restart nginx
```

### C. CodeIgniter Framework Timezone
CodeIgniter explicitly defines a fallback application timezone. Edit `/var/www/wappbuzz/app/Config/App.php`:
```php
public $appTimezone = 'Asia/Kolkata';
```

## 2. Setting 12-Hour Time Format in APIs
By default, PHP's `date()` function uses 24-hour format (`H:i`). If the UI design in the Flutter App expects a 12-hour format with AM/PM (so it can be displayed nicely without requiring complex parsing logic on the client side), the PHP API must be updated.

**24-Hour Format (Wrong):**
```php
date('Y-m-d H:i', $timestamp) // Output: 2026-07-30 18:11
```
**12-Hour Format (Correct):**
```php
date('Y-m-d h:i A', $timestamp) // Output: 2026-07-30 06:11 PM
```

### Key Formatting Characters:
- `h` = 12-hour format of an hour with leading zeros (01 through 12)
- `H` = 24-hour format of an hour with leading zeros (00 through 23)
- `i` = Minutes with leading zeros (00 to 59)
- `A` = Uppercase Ante meridiem and Post meridiem (AM or PM)

If you modify time formatting in `Admin_API.php`, you can safely use `str_replace` across the file for `date('Y-m-d H:i'`, provided you verify it doesn't break JSON serializers that expect strict ISO-8601 strings. In this app, `created_at` strings are typically displayed directly in the UI as parsed strings.
