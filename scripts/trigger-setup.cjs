
const https = require('https');

const data = JSON.stringify({});

const options = {
  hostname: 'oxlxjakwoekbiownvmhv.supabase.co',
  path: '/functions/v1/setup-stripe-plans',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94bHhqYWt3b2VrYmlvd252bWh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU5NzU2OSwiZXhwIjoyMDc5MTczNTY5fQ.s4_-xdYQ9UnEqj4W1qs6FgBaxBY-sFvvQMPwclmMcAI',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);

  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
