require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

async function cleanDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // 1. Locate the primary admin (jawad@gmail.com) under cszone
    const usersCol = db.collection('users');
    let admin = await usersCol.findOne({ email: 'jawad@gmail.com', role: 'admin', tenantId: 'cszone' });
    
    if (!admin) {
      // Fallback: search any admin with jawad@gmail.com
      admin = await usersCol.findOne({ email: 'jawad@gmail.com', role: 'admin' });
      if (admin) {
        await usersCol.updateOne(
          { _id: admin._id },
          { $set: { tenantId: 'cszone', isActive: true, isApproved: true, isVerified: true } }
        );
      }
    }

    if (!admin) {
      throw new Error('❌ Admin user jawad@gmail.com not found! Aborting to prevent lockout.');
    }

    console.log(`🛡️  Preserving Admin: ${admin.name} (${admin.email}) [ID: ${admin._id}] [Tenant: cszone]`);

    // 2. Remove all users except this admin
    const userDeleteResult = await usersCol.deleteMany({ _id: { $ne: admin._id } });
    console.log(`🗑️  Deleted ${userDeleteResult.deletedCount} non-admin user(s).`);

    // Ensure the preserved admin has proper tenant and status
    await usersCol.updateOne(
      { _id: admin._id },
      { $set: { tenantId: 'cszone', role: 'admin', isActive: true, isApproved: true, isVerified: true } }
    );

    // 3. Collections to clear completely
    const collectionsToClear = [
      'courses',
      'majors',
      'programs',
      'videolectures',
      'quizzes',
      'quizquestions',
      'quizattempts',
      'courseregistrations',
      'lectureprogresses',
      'sessions',
      'attendances',
      'documents',
      'lmsdocuments',
      'certificates',
      'certificatetemplates',
      'activitylogs',
      'notifications',
      'assignments'
    ];

    for (const colName of collectionsToClear) {
      try {
        const col = db.collection(colName);
        const count = await col.countDocuments();
        if (count > 0) {
          const res = await col.deleteMany({});
          console.log(`🧹 Cleared collection [${colName}]: deleted ${res.deletedCount} documents.`);
        } else {
          console.log(`✓ Collection [${colName}] is already empty.`);
        }
      } catch (err) {
        console.warn(`⚠️  Could not clear collection ${colName}:`, err.message);
      }
    }

    // 4. Seed the 3 official PPSC programs for tenant 'cszone'
    // so homepage and admin panel show identical official tracks
    const programsCol = db.collection('programs');
    const officialPrograms = [
      {
        tenantId: 'cszone',
        name: 'Water Management Officer (BS-17) | PPSC Preparation',
        code: 'WMO-BS17',
        school: 'School of Agriculture',
        degreeLevel: 'BS-17 Track',
        description: 'Comprehensive preparation program for Water Management Officer (BS-17) PPSC exams, covering irrigation techniques, soil physics, hydrology, and agricultural engineering concepts.',
        featuredOnHomepage: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenantId: 'cszone',
        name: 'Agriculture Officer (BS-17) | PPSC Preparation',
        code: 'AO-BS17',
        school: 'School of Agriculture',
        degreeLevel: 'BS-17 Track',
        description: 'Complete syllabus coverage for Agriculture Officer (BS-17) competitive test, focusing on agronomy, plant pathology, entomology, and agricultural economics.',
        featuredOnHomepage: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenantId: 'cszone',
        name: 'Assistant Director (BS-18) | PPSC Preparation',
        code: 'AD-BS18',
        school: 'School of Agriculture',
        degreeLevel: 'BS-18 Track',
        description: 'Specialized executive prep track for Assistant Director (BS-18) selection exams, featuring high-yield study materials, past paper analysis, and mock tests.',
        featuredOnHomepage: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await programsCol.insertMany(officialPrograms);
    console.log('🌱 Seeded 3 official PPSC Programs for tenant [cszone]:');
    officialPrograms.forEach(p => console.log(`   - ${p.name} (${p.code})`));

    // 5. Final verification summary
    console.log('\n📊 Final Database Summary:');
    const remainingUsers = await usersCol.find({}, { projection: { name: 1, email: 1, role: 1, tenantId: 1 } }).toArray();
    console.log('Users:', remainingUsers);
    const remainingPrograms = await programsCol.find({}, { projection: { name: 1, code: 1, tenantId: 1 } }).toArray();
    console.log('Programs:', remainingPrograms);

    console.log('\n✨ Database reset completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
}

cleanDatabase();
