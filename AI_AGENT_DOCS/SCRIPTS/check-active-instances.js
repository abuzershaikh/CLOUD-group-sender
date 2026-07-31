#!/usr/bin/env node

/**
 * Active Instances Checker
 * 
 * Purpose: Check active WhatsApp instances across the system
 * Usage: node check-active-instances.js [team_id]
 * 
 * Checks:
 * 1. Memory (sessions object)
 * 2. Database (sp_whatsapp_sessions)
 * 3. File system (sessions directory)
 * 4. Validates consistency
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Configuration (update these values)
const CONFIG = {
    db: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'waziper_db'
    },
    sessionsPath: path.join(__dirname, '../../Wazipar/01-02-2026bt_wa/sessions'),
    nodeApiUrl: process.env.NODE_API || 'http://localhost:3000'
};

/**
 * Colors for console output
 */
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Check database for active sessions
 */
async function checkDatabase(teamId = null) {
    let connection;
    try {
        connection = await mysql.createConnection(CONFIG.db);
        
        let query = `
            SELECT 
                s.instance_id,
                s.name,
                s.phone,
                s.status,
                a.login_type,
                FROM_UNIXTIME(s.created) as created_at
            FROM sp_whatsapp_sessions s
            LEFT JOIN sp_accounts a ON s.instance_id = a.token
            WHERE s.status = 1
        `;
        
        const params = [];
        if (teamId) {
            query += ' AND s.team_id = ?';
            params.push(teamId);
        }
        
        query += ' ORDER BY s.created DESC';
        
        const [rows] = await connection.execute(query, params);
        
        return {
            count: rows.length,
            instances: rows
        };
    } catch (error) {
        log(`❌ Database Error: ${error.message}`, 'red');
        return { count: 0, instances: [], error: error.message };
    } finally {
        if (connection) await connection.end();
    }
}

/**
 * Check file system for session directories
 */
function checkFileSystem() {
    try {
        if (!fs.existsSync(CONFIG.sessionsPath)) {
            log(`⚠️  Sessions directory not found: ${CONFIG.sessionsPath}`, 'yellow');
            return { count: 0, instances: [] };
        }
        
        const dirs = fs.readdirSync(CONFIG.sessionsPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => {
                const dirPath = path.join(CONFIG.sessionsPath, dirent.name);
                const credsPath = path.join(dirPath, 'creds.json');
                
                return {
                    instance_id: dirent.name,
                    has_creds: fs.existsSync(credsPath),
                    creds_size: fs.existsSync(credsPath) 
                        ? fs.statSync(credsPath).size 
                        : 0
                };
            });
        
        return {
            count: dirs.length,
            instances: dirs
        };
    } catch (error) {
        log(`❌ File System Error: ${error.message}`, 'red');
        return { count: 0, instances: [], error: error.message };
    }
}

/**
 * Check Node.js API for active sessions
 */
async function checkNodeAPI() {
    try {
        const axios = require('axios');
        
        // Try to get health check or active sessions endpoint
        const response = await axios.get(`${CONFIG.nodeApiUrl}/health_check`, {
            timeout: 5000
        });
        
        // Parse response for session count
        // Note: This depends on your API structure
        return {
            count: response.data.active_sessions || 0,
            api_status: 'online',
            data: response.data
        };
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            log('⚠️  Node.js server is not running', 'yellow');
        }
        return {
            count: 0,
            api_status: 'offline',
            error: error.message
        };
    }
}

/**
 * Main execution
 */
async function main() {
    const teamId = process.argv[2];
    
    log('\n' + '='.repeat(60), 'cyan');
    log('🔍 ACTIVE INSTANCES CHECKER', 'bold');
    log('='.repeat(60) + '\n', 'cyan');
    
    if (teamId) {
        log(`📊 Filtering by Team ID: ${teamId}\n`, 'cyan');
    }
    
    // 1. Check Database
    log('1️⃣  Checking Database...', 'bold');
    const dbResult = await checkDatabase(teamId);
    if (dbResult.error) {
        log(`   ❌ Error: ${dbResult.error}`, 'red');
    } else {
        log(`   ✅ Active in DB: ${dbResult.count}`, 'green');
        if (dbResult.count > 0) {
            dbResult.instances.forEach((inst, idx) => {
                log(`      ${idx + 1}. ${inst.name || 'Unknown'} (${inst.phone || 'No phone'})`, 'cyan');
                log(`         Instance ID: ${inst.instance_id}`, 'cyan');
            });
        }
    }
    
    // 2. Check File System
    log('\n2️⃣  Checking File System...', 'bold');
    const fsResult = checkFileSystem();
    if (fsResult.error) {
        log(`   ❌ Error: ${fsResult.error}`, 'red');
    } else {
        log(`   ✅ Session Directories: ${fsResult.count}`, 'green');
        if (fsResult.count > 0) {
            fsResult.instances.forEach((inst, idx) => {
                const status = inst.has_creds ? '✓' : '✗';
                log(`      ${idx + 1}. ${inst.instance_id} [${status}]`, 'cyan');
            });
        }
    }
    
    // 3. Check Node.js API
    log('\n3️⃣  Checking Node.js API...', 'bold');
    const apiResult = await checkNodeAPI();
    if (apiResult.error) {
        log(`   ⚠️  ${apiResult.error}`, 'yellow');
    } else {
        log(`   ✅ API Status: ${apiResult.api_status}`, 'green');
        if (apiResult.count !== undefined) {
            log(`   ✅ Active Sessions (API): ${apiResult.count}`, 'green');
        }
    }
    
    // 4. Summary
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 SUMMARY', 'bold');
    log('='.repeat(60), 'cyan');
    log(`Database Active:        ${dbResult.count}`, 'green');
    log(`File System Sessions:   ${fsResult.count}`, 'green');
    log(`Node.js API Status:     ${apiResult.api_status}`, apiResult.api_status === 'online' ? 'green' : 'yellow');
    
    // 5. Validation
    log('\n🔍 Consistency Check:', 'bold');
    if (dbResult.count === fsResult.count) {
        log('   ✅ Database and File System match', 'green');
    } else {
        log('   ⚠️  Mismatch detected:', 'yellow');
        log(`      DB: ${dbResult.count}, FS: ${fsResult.count}`, 'yellow');
        
        if (dbResult.count > fsResult.count) {
            log('      → Some instances in DB have no session files', 'yellow');
            log('      → These instances may need re-authentication', 'yellow');
        } else {
            log('      → Some session files have no DB records', 'yellow');
            log('      → These may be orphaned sessions', 'yellow');
        }
    }
    
    log('\n' + '='.repeat(60) + '\n', 'cyan');
}

// Run
main().catch(error => {
    log(`\n❌ Fatal Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
