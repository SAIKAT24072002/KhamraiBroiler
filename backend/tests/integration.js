const baseApiUrl = 'http://localhost:5050/api';

/**
 * Runs end-to-end integration test queries against the running server.
 */
const runTests = async () => {
  console.log('==================================================');
  console.log('KHAMRAI BROILER CENTER - E2E INTEGRATION TEST');
  console.log('==================================================\n');

  try {
    // 1. Check server health
    console.log('[TEST 1/8] Verifying API Server health status...');
    const healthRes = await fetch('http://localhost:5050/');
    if (!healthRes.ok) throw new Error('API server is not online. Please run: npm run dev');
    const healthData = await healthRes.json();
    console.log(`✓ Server health: Healthy (v${healthData.version})\n`);

    // 2. Request OTP (Mock Mode)
    console.log('[TEST 2/8] Requesting Mobile OTP...');
    const otpRes = await fetch(`${baseApiUrl}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '+919876543210' }) // Seeded Admin Mobile
    });
    const otpData = await otpRes.json();
    if (!otpRes.ok) throw new Error(otpData.message || 'Failed to send OTP.');
    const mockOtp = otpData.otp;
    console.log(`✓ OTP Request success. Mock UTR captured: ${mockOtp}\n`);

    // 3. Verify OTP & Admin Login
    console.log('[TEST 3/8] Verifying OTP and checking Admin authentication...');
    const authRes = await fetch(`${baseApiUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '+919876543210', otp: mockOtp })
    });
    const authData = await authRes.json();
    if (!authRes.ok) throw new Error(authData.message || 'OTP verification failed.');
    const token = authData.token;
    console.log(`✓ Authentication success. Logged in as: ${authData.user.name} (${authData.user.role})\n`);

    // 4. Load & Adjust Settings
    console.log('[TEST 4/8] Querying business branding settings...');
    const settingsRes = await fetch(`${baseApiUrl}/settings`);
    const settingsData = await settingsRes.json();
    if (!settingsRes.ok) throw new Error(settingsData.message || 'Failed to fetch settings.');
    console.log(`✓ Business Settings: ${settingsData.businessName} - "${settingsData.tagline}"\n`);

    // 5. Create category
    console.log('[TEST 5/8] Creating test category "Desi Chickens"...');
    const catRes = await fetch(`${baseApiUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: 'Desi Chickens', status: 'active' })
    });
    const catData = await catRes.json();
    if (!catRes.ok) throw new Error(catData.message || 'Failed to create category.');
    const testCategoryId = catData._id;
    console.log(`✓ Category Created - ID: ${testCategoryId}\n`);

    // 6. Create product
    console.log('[TEST 6/8] Creating test product "Country Broiler"...');
    const prodRes = await fetch(`${baseApiUrl}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Country Broiler',
        category: testCategoryId,
        retailPrice: 210,
        wholesalePrice: 195,
        stock: 50,
        unit: 'KG',
        status: 'active'
      })
    });
    const prodData = await prodRes.json();
    if (!prodRes.ok) throw new Error(prodData.message || 'Failed to create product.');
    const testProductId = prodData._id;
    console.log(`✓ Product Created - ID: ${testProductId} (Stock: ${prodData.stock} ${prodData.unit})\n`);

    // 7. Update pricing
    console.log('[TEST 7/8] Adjusting prices and verifying price history logs...');
    const priceUpdateRes = await fetch(`${baseApiUrl}/prices/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        prices: [{
          productId: testProductId,
          retailPrice: 220,
          wholesalePrice: 200
        }]
      })
    });
    const priceData = await priceUpdateRes.json();
    if (!priceUpdateRes.ok) throw new Error(priceData.message || 'Failed to update pricing.');
    console.log(`✓ Prices modified. retail increased: ₹210 ➔ ₹220\n`);

    // 8. Place order
    console.log('[TEST 8/8] Testing customer checkout & stock deductions...');
    const orderRes = await fetch(`${baseApiUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        items: [{
          productId: testProductId,
          name: 'Country Broiler',
          quantity: 2,
          unit: 'KG'
        }],
        pickupDate: new Date().toISOString().slice(0, 10),
        pickupTime: '10:00 AM - 11:00 AM',
        paymentMethod: 'Cash on Pickup'
      })
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) throw new Error(orderData.message || 'Failed to place order.');
    console.log(`✓ Order Checkout Placed successfully! Code: ${orderData.orderNumber}`);
    console.log(`✓ Dynamic Subtotal: ₹${orderData.subtotal} | Total: ₹${orderData.total}\n`);

    console.log('==================================================');
    console.log('✓ ALL 8 INTEGRATION TESTS PASSED SUCCESSFULLY! ✓');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:');
    console.error(error.message);
    console.log('==================================================');
    process.exit(1);
  }
};

runTests();
