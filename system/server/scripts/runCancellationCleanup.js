const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const sqlFilePath = path.join(__dirname, '2025-12-01-cancellation-cleanup.sql');

const runScript = async () => {
  console.log('Starting cancellation cleanup and presence migration...');

  try {
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
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

    for (const statement of statements) {
        await new Promise((resolve, reject) => {
            db.query(statement, (err, result) => {
                if (err) {
                    console.warn(`Warning executing statement: ${statement.substring(0, 50)}...`);
                    console.warn(err.message);
                    resolve(); 
                } else {
                    resolve(result);
                }
            });
        });
    }

    console.log('Cancellation cleanup and presence migration completed.');
    process.exit(0);

  } catch (error) {
    console.error('Error running script:', error);
    process.exit(1);
  }
};

runScript();
