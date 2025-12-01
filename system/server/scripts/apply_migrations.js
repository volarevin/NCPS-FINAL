// Node script to apply SQL migrations in order (idempotent)
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load env from server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0,
  multipleStatements: true // Enable multiple statements
});

async function run() {
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`Processing ${file}...`);
    const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    
    try {
      await executeSqlScript(sqlContent);
      console.log(`Successfully applied ${file}`);
    } catch (e) {
      console.error(`Failed to apply ${file}:`, e);
      process.exit(1);
    }
  }
  
  console.log('All migrations complete');
  pool.end();
  process.exit(0);
}

async function executeSqlScript(content) {
  // Simple parser to handle DELIMITER
  const lines = content.split('\n');
  let delimiter = ';';
  let buffer = '';
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    if (line.startsWith('DELIMITER')) {
      delimiter = line.split(' ')[1].trim();
      continue;
    }
    
    // Append line to buffer (preserve newlines for readability/correctness)
    buffer += lines[i] + '\n';
    
    // Check if the buffer ends with the delimiter
    // We check the trimmed line to see if it ends with delimiter
    if (line.endsWith(delimiter)) {
      // Remove delimiter from the end of the buffer
      // Note: We need to be careful not to remove it if it's part of a string, 
      // but in SQL scripts, delimiter usually stands alone or at end of line.
      
      let sql = buffer.trim();
      if (sql.endsWith(delimiter)) {
        sql = sql.slice(0, -delimiter.length).trim();
      }
      
      if (sql.length > 0) {
        await new Promise((resolve, reject) => {
          pool.query(sql, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      buffer = '';
    }
  }
  
  // Execute any remaining buffer
  if (buffer.trim().length > 0) {
     let sql = buffer.trim();
     if (sql.endsWith(delimiter)) {
        sql = sql.slice(0, -delimiter.length).trim();
     }
     if (sql.length > 0) {
        await new Promise((resolve, reject) => {
          pool.query(sql, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
     }
  }
}

run();
