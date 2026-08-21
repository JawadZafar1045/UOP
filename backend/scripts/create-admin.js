require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../modules/auth/models/user.model');

async function seedAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);

    const email = 'admin@cszone.pk';
    const password = 'AdminPassword123!';
    const tenantId = 'cszone';

    let admin = await User.findOne({ email });
    if (admin) {
      admin.role = 'admin';
      admin.tenantId = tenantId;
      admin.isActive = true;
      admin.isVerified = true;
      admin.password = password; // will be hashed by pre-save hook
      await admin.save();
      console.log('✅ Updated existing Admin credentials:');
    } else {
      admin = await User.create({
        name: 'CSZone Admin',
        email,
        password,
        role: 'admin',
        tenantId,
        isActive: true,
        isVerified: true,
      });
      console.log('✅ Created new Admin account:');
    }

    console.log('-------------------------------------------');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Tenant:   ${tenantId}`);
    console.log('-------------------------------------------');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin user:', err);
    process.exit(1);
  }
}

seedAdmin();
