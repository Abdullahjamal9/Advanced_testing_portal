// Test API
fetch('http://localhost:3001/api/info?standard=Cumulative')
  .then(r => r.json())
  .then(data => {
    console.log('API Response:');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(err => console.error('Error:', err));