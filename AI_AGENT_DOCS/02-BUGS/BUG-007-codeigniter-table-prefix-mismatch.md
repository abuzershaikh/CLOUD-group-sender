# BUG-007: CodeIgniter Table Prefix Mismatch (500 Transaction Error)

## Symptoms
- Flutter app returns a 500 error when calling the `/admin_api/bulk_create_campaign` (or `/admin_api/create_campaign`) endpoints.
- The `bulk_create_campaign` API fails to queue the campaign.
- Both CodeIgniter application logs (e.g., `writable/logs/log-*.php`) and Database logs (`$db->error()`) return an empty error message or error code `0`.
- The transaction silently rolls back.

## Root Cause
The root cause is a table prefix mismatch between the CodeIgniter Query Builder and the actual database tables.

1. The `sp_` prefix is hardcoded in almost all SQL queries across the application (e.g., `$db->table('sp_whatsapp_sessions')`).
2. However, some newer functions like `bulk_create_campaign` use the dynamic prefix resolver: `$db->table($db->prefixTable('android_campaign_queue'))`.
3. In `app/Config/Database.php`, the `DBPrefix` configuration is set to an empty string (`''`).
4. Therefore, `$db->prefixTable('android_campaign_queue')` evaluates to `'android_campaign_queue'` (without the `sp_` prefix).
5. The application attempts to insert into `android_campaign_queue`.
6. Since the table `android_campaign_queue` does not exist (the actual table is `sp_android_campaign_queue`), the query fails.
7. Due to CodeIgniter 4's query builder logic in transactions, a missing table might return `false` on `insert()` without throwing a verbose `DatabaseException` when `DBDebug` behaves silently in production, but triggers `$db->transStatus() === false`.
8. The transaction rolls back, resulting in a silent 500 failure.

**Note:** A developer previously created a duplicate table named `android_campaign_status` (without `sp_`) directly in the database to fix the first insert query, but forgot to create `android_campaign_queue`. This masked the first query's failure, causing only the second query to fail.

## Fix / Resolution
Always use explicit hardcoded table names with the `sp_` prefix to match the rest of the legacy codebase, rather than relying on `$db->prefixTable()`.

### Example Fix in `Admin_API.php`:

**Incorrect (Before):**
```php
$res1 = $db->table($db->prefixTable('android_campaign_queue'))->insert([ ... ]);
$res2 = $db->table($db->prefixTable('android_campaign_status'))->insert([ ... ]);
```

**Correct (After):**
```php
$res1 = $db->table('sp_android_campaign_queue')->insert([ ... ]);
$res2 = $db->table('sp_android_campaign_status')->insert([ ... ]);
```

## How to Debug Similar Issues in the Future
If a database transaction in CodeIgniter fails silently:
1. Inject explicit logging right before `transComplete()` to capture query outputs and errors.
2. Check `(int)$res1` and `(int)$res2` (the boolean results of the inserts). If they evaluate to `0`, the query failed.
3. If `$db->error()` is empty, verify the **exact table name** in the executed SQL using `$db->getLastQuery()`. 
4. Check if the exact table name from the generated SQL exists in MySQL using `SHOW TABLES;`. Do not assume CodeIgniter appended the prefix.
