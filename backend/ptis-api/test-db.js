const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'AJptis-3692',
  database: process.env.DB_NAME || 'ptis_testing'
});

console.log('Testing database connection...');

db.connect((err) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    return;
  }
  console.log('✅ Connected to MySQL Database');
  
  // Test employees table
  db.query('SELECT COUNT(*) as count FROM employees', (err, results) => {
    if (err) {
      console.error('❌ Employees query failed:', err.message);
    } else {
      console.log('✅ Employees count:', results[0].count);
    }
    
    // Test standards table
    db.query('SELECT COUNT(*) as count FROM standard', (err, results) => {
      if (err) {
        console.error('❌ Standards query failed:', err.message);
      } else {
        console.log('✅ Standards count:', results[0].count);
      }
      
      // Test actual data
      db.query('SELECT * FROM employees LIMIT 3', (err, results) => {
        if (err) {
          console.error('❌ Employee data query failed:', err.message);
        } else {
          console.log('✅ Sample employees:', results);
        }
        
        db.query('SELECT * FROM standard LIMIT 3', (err, results) => {
          if (err) {
            console.error('❌ Standard data query failed:', err.message);
          } else {
            console.log('✅ Sample standards:', results);
          }
          
          db.end();
          console.log('Test complete.');
        });
      });
    });
  });
});