const mysql = require('mysql2/promise');
const config = require('./config.js');
async function test() {
    const pool = mysql.createPool(config.database);
    const [rows] = await pool.query('SELECT * FROM sp_android_campaign_queue ORDER BY created DESC LIMIT 1');
    console.log('Value:', rows[0].delay_seconds, 'Type:', typeof rows[0].delay_seconds);
    process.exit(0);
}
test();
