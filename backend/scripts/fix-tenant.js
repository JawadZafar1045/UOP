/**
 * Fix: Add tenantId to courses that are missing it.
 * Run: node scripts/fix-tenant.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function fix() {
  if (!MONGO_URI) { console.error('❌ MONGODB_URI not set'); process.exit(1); }

  console.log('🔌 Connecting...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected!\n');

  const CourseColl = mongoose.connection.collection('courses');

  // Step 1: Get tenantId from any existing course that HAS one
  const sampleWithTenant = await CourseColl.findOne({ tenantId: { $exists: true, $ne: null } });
  if (!sampleWithTenant) {
    console.error('❌ No courses with tenantId found! Cannot determine tenantId.');
    process.exit(1);
  }

  const tenantId = sampleWithTenant.tenantId;
  console.log(`🏷️  Using tenantId: ${tenantId}\n`);

  // Step 2: Find all courses WITHOUT tenantId
  const orphans = await CourseColl.find({ $or: [{ tenantId: { $exists: false } }, { tenantId: null }] }).toArray();
  console.log(`Found ${orphans.length} courses without tenantId:\n`);
  orphans.forEach(c => console.log(`  - ${c.title}`));

  if (orphans.length === 0) {
    console.log('✅ All courses already have tenantId. Nothing to fix!');
    await mongoose.disconnect();
    process.exit(0);
  }

  // Step 3: Patch them all
  const result = await CourseColl.updateMany(
    { $or: [{ tenantId: { $exists: false } }, { tenantId: null }] },
    { $set: { tenantId } }
  );

  console.log(`\n✅ Fixed ${result.modifiedCount} courses — tenantId added.`);
  console.log('🎉 Refresh the admin panel now!\n');

  await mongoose.disconnect();
  process.exit(0);
}

fix().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
