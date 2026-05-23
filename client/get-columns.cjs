const fs = require('fs');
const path = require('path');

let url = '';
let key = '';
try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      url = line.split('=')[1].trim();
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      key = line.split('=')[1].trim();
    }
  }
} catch (e) {
  console.error('Error reading client/.env:', e.message);
  process.exit(1);
}

async function inspectSchema() {
  try {
    const res = await fetch(`${url}/rest/v1/?apikey=${key}`);
    const swagger = await res.json();
    console.log('Available definitions in Swagger:', Object.keys(swagger.definitions || {}));
    
    for (const t of ['customers', 'measurements', 'orders']) {
      if (swagger.definitions[t]) {
        console.log(`\nProperties for table [${t}]:`);
        console.log(Object.keys(swagger.definitions[t].properties || {}));
      } else {
        console.log(`\nTable [${t}] not found in Swagger definitions.`);
      }
    }
  } catch (err) {
    console.error('Error fetching OpenAPI spec:', err.message);
  }
}

inspectSchema();
