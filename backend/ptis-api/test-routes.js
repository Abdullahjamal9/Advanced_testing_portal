// Test routes
fetch('http://localhost:3001/api/_routes')
  .then(r => r.json())
  .then(data => {
    console.log('\n=== Standard & Info Routes ===');
    data.routes
      .filter(r => r.path.includes('standard') || r.path.includes('info'))
      .forEach(r => {
        console.log(`${r.methods.join(',')} ${r.path}`);
      });
  })
  .catch(err => console.error('Error:', err));
