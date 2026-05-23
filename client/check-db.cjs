const { createClient } = require('@supabase/supabase-js');
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

const supabase = createClient(url, key);

async function testSchema() {
  try {
    // 1. Create a dummy customer so we have a valid customer_id
    console.log('--- 👤 Creating dummy customer ---');
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .insert([{ name: 'Test Customer Schema', phone: '99999', address: 'Test Address' }])
      .select()
      .single();
      
    if (custErr) {
      console.error('❌ Customer insert failed:', custErr.message);
      return;
    }
    console.log('✅ Customer created with ID:', customer.id);

    // 2. Try inserting into orders table with requested columns
    console.log('\n--- 📋 Testing orders insertion ---');
    const orderData = {
      customer_id: customer.id,
      cloth_type: 'Test Suit',
      quantity: 1,
      status: 'Received',
      total_amount: 1000,
      advance_amount: 200,
      remaining_amount: 800,
      cloth_image: 'https://example.com/cloth.jpg'
    };
    
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert([orderData])
      .select();
      
    if (orderErr) {
      console.error('❌ Order insert failed:', orderErr.message, orderErr);
    } else {
      console.log('✅ Order insert successful! Inserted:', order[0]);
    }

    // 3. Try inserting into measurements table with requested columns
    console.log('\n--- 📐 Testing measurements insertion ---');
    const measData = {
      customer_id: customer.id,
      shoulder: 18,
      chest: 40,
      waist: 34,
      collar: 15,
      neck: 15,
      sleeve_length: 25,
      inseam: 32,
      fitting_notes: 'Fit notes test'
    };
    
    const { data: meas, error: measErr } = await supabase
      .from('measurements')
      .insert([measData])
      .select();
      
    if (measErr) {
      console.error('❌ Measurements insert failed:', measErr.message, measErr);
    } else {
      console.log('✅ Measurements insert successful! Inserted:', meas[0]);
    }

    // 4. Cleanup dummy records
    console.log('\n--- 🧹 Cleaning up test records ---');
    await supabase.from('measurements').delete().eq('customer_id', customer.id);
    await supabase.from('orders').delete().eq('customer_id', customer.id);
    await supabase.from('customers').delete().eq('id', customer.id);
    console.log('✅ Test data cleaned up successfully.');

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testSchema();
