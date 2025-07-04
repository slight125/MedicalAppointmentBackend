#!/usr/bin/env node

// Test Prescription Creation Logic
// This script tests the prescription endpoints using Node.js

const baseUrl = "http://localhost:3000";

console.log("🧪 Testing Prescription Creation Logic");
console.log("=====================================");

async function testPrescriptionCreation() {
  const prescriptionPayload = {
    appointment_id: 1,
    doctor_id: 1,
    medicines: [
      {
        name: "Aspirin",
        dosage: "100mg",
        frequency: "Once daily"
      },
      {
        name: "Vitamin D",
        dosage: "1000 IU",
        frequency: "Daily"
      }
    ],
    notes: "Take with food. Complete the full course."
  };

  try {
    console.log("\n📋 Test 1: Creating test prescription...");
    
    const response = await fetch(`${baseUrl}/api/dev/test-prescription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prescriptionPayload)
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Test prescription created successfully!");
      console.log(JSON.stringify(data, null, 2));
    } else {
      const error = await response.json();
      console.log("❌ Test prescription creation failed:");
      console.log(JSON.stringify(error, null, 2));
    }
  } catch (error) {
    console.log("❌ Network error:", error.message);
  }

  // Test duplicate prevention
  try {
    console.log("\n📋 Test 2: Testing duplicate prevention...");
    
    const response = await fetch(`${baseUrl}/api/dev/test-prescription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prescriptionPayload)
    });

    if (response.ok) {
      console.log("❌ Duplicate prescription was created (this should not happen!)");
    } else {
      console.log("✅ Duplicate prescription correctly prevented!");
      const error = await response.json();
      console.log(JSON.stringify(error, null, 2));
    }
  } catch (error) {
    console.log("❌ Network error:", error.message);
  }
}

async function testAppointmentUpdate() {
  try {
    console.log("\n💰 Test 3: Testing appointment payment update...");
    
    const response = await fetch(`${baseUrl}/api/dev/test-appointment-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment_id: 1 })
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Appointment marked as paid!");
      console.log(JSON.stringify(data, null, 2));
    } else {
      const error = await response.json();
      console.log("❌ Appointment update failed:");
      console.log(JSON.stringify(error, null, 2));
    }
  } catch (error) {
    console.log("❌ Network error:", error.message);
  }
}

async function testPaymentCreation() {
  try {
    console.log("\n💳 Test 4: Creating simple payment...");
    
    const response = await fetch(`${baseUrl}/api/dev/simple-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment_id: 1, amount: 75.50 })
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Payment created successfully!");
      console.log(JSON.stringify(data, null, 2));
    } else {
      const error = await response.json();
      console.log("❌ Payment creation failed:");
      console.log(JSON.stringify(error, null, 2));
    }
  } catch (error) {
    console.log("❌ Network error:", error.message);
  }
}

async function listPayments() {
  try {
    console.log("\n📊 Test 5: Listing all payments...");
    
    const response = await fetch(`${baseUrl}/api/dev/simple-payments`);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Payments retrieved successfully!");
      console.log(JSON.stringify(data, null, 2));
    } else {
      const error = await response.json();
      console.log("❌ Failed to retrieve payments:");
      console.log(JSON.stringify(error, null, 2));
    }
  } catch (error) {
    console.log("❌ Network error:", error.message);
  }
}

async function runAllTests() {
  await testPrescriptionCreation();
  await testAppointmentUpdate();
  await testPaymentCreation();
  await listPayments();
  
  console.log("\n🎉 All tests completed!");
  console.log("Note: Ensure your backend server is running on http://localhost:3000");
}

runAllTests();
