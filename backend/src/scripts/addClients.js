const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' });

const Client = require('../models/Client');

const clients = [
  {
    name: 'John Smith',
    room: '101',
    careLevel: 'High',
    medicationNeeded: true,
    notes: 'Requires assistance with mobility'
  },
  {
    name: 'Sarah Johnson',
    room: '102',
    careLevel: 'Medium',
    medicationNeeded: true,
    notes: 'Diabetes management required'
  },
  {
    name: 'Michael Brown',
    room: '103',
    careLevel: 'High',
    medicationNeeded: true,
    notes: 'Limited mobility, uses wheelchair'
  },
  {
    name: 'Emily Davis',
    room: '104',
    careLevel: 'Low',
    medicationNeeded: false,
    notes: 'Independent with daily activities'
  },
  {
    name: 'Robert Wilson',
    room: '105',
    careLevel: 'High',
    medicationNeeded: true,
    notes: 'Memory care required, dementia stage 2'
  },
  {
    name: 'Patricia Miller',
    room: '201',
    careLevel: 'Medium',
    medicationNeeded: true,
    notes: 'Arthritis management, physical therapy'
  },
  {
    name: 'James Taylor',
    room: '202',
    careLevel: 'Low',
    medicationNeeded: true,
    notes: 'Regular monitoring needed'
  },
  {
    name: 'Linda Anderson',
    room: '203',
    careLevel: 'High',
    medicationNeeded: true,
    notes: 'Speech therapy, post-stroke recovery'
  },
  {
    name: 'David Thomas',
    room: '204',
    careLevel: 'Medium',
    medicationNeeded: true,
    notes: 'Cardiac monitoring required'
  },
  {
    name: 'Barbara Jackson',
    room: '205',
    careLevel: 'Low',
    medicationNeeded: false,
    notes: 'Requires supervision for safety'
  }
];

async function addClients() {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/ndis';
    await mongoose.connect(mongoUrl);
    console.log('✅ MongoDB connected');

    // Check if clients already exist
    const existingCount = await Client.countDocuments();
    console.log(`📊 Existing clients: ${existingCount}`);

    // Insert clients
    const result = await Client.insertMany(clients);
    console.log(`✅ Added ${result.length} clients successfully`);

    // Show all clients
    const allClients = await Client.find({});
    console.log('\n📋 All clients:');
    allClients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.name} (Room ${client.room}, Care Level: ${client.careLevel})`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addClients();
