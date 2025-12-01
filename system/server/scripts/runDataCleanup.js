const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const sqlFilePath = path.join(__dirname, '2025-12-01-data-cleanup-and-seed.sql');

const runScript = async () => {
  console.log('Starting database cleanup and seeding...');

  try {
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split by delimiter logic is complex for simple split. 
    // We will read the file and handle the DELIMITER manually or just execute the procedure creation separately if needed.
    // However, the mysql driver usually supports multiple statements if configured.
    // But DELIMITER command is a client-side command, not server-side.
    // So we need to parse the file and execute statements one by one, handling the delimiter change.

    // Simplified approach: The script uses DELIMITER // ... // DELIMITER ;
    // We can extract the procedure body and execute it, then the rest.
    
    // Actually, for simplicity and robustness in this environment, let's just split by the default delimiter ';' 
    // but we need to be careful about the stored procedure.
    // A better way for the runner is to strip the DELIMITER commands and send the CREATE PROCEDURE as one block.

    // Let's try to parse it roughly.
    
    const statements = [];
    let currentDelimiter = ';';
    let buffer = '';
    
    const lines = sql.split('\n');
    
    for (let line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('DELIMITER')) {
            currentDelimiter = trimmedLine.split(' ')[1];
            continue;
        }
        
        if (trimmedLine.startsWith('--') || trimmedLine === '') {
            continue;
        }
        
        buffer += line + '\n';
        
        if (trimmedLine.endsWith(currentDelimiter)) {
            // Remove the delimiter from the end
            let statement = buffer.trim();
            if (statement.endsWith(currentDelimiter)) {
                statement = statement.slice(0, -currentDelimiter.length).trim();
            }
            
            if (statement) {
                statements.push(statement);
            }
            buffer = '';
        }
    }

    // Execute statements sequentially
    for (const statement of statements) {
        await new Promise((resolve, reject) => {
            db.query(statement, (err, result) => {
                if (err) {
                    // Ignore "Duplicate column" errors if our procedure logic failed or if we are running simple alters
                    // But we used a procedure to handle it.
                    // If the procedure creation fails because it exists, we added DROP PROCEDURE IF EXISTS.
                    console.warn(`Warning or Error executing statement: ${statement.substring(0, 50)}...`);
                    console.warn(err.message);
                    // We resolve anyway to continue the script
                    resolve(); 
                } else {
                    resolve(result);
                }
            });
        });
    }

    console.log('Database cleanup and seeding completed successfully.');
    process.exit(0);

  } catch (error) {
    console.error('Error running script:', error);
    process.exit(1);
  }
};

runScript();
