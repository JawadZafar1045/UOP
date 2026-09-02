require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Program = require('../modules/lms/models/program.model');

async function seedPrograms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Remove existing test/mock programs for clean state
    await Program.deleteMany({ tenantId: { $in: ['cszone', 'iub'] } });

    const newPrograms = [
      {
        tenantId: 'cszone',
        name: 'Water Management Officer (BS-17) | PPSC Preparation',
        code: 'WMO-BS17',
        school: 'School of Agriculture',
        description: 'Comprehensive preparation program for Water Management Officer (BS-17) PPSC exams, covering irrigation techniques, soil physics, hydrology, and agricultural engineering concepts.',
        featuredOnHomepage: true,
      },
      {
        tenantId: 'cszone',
        name: 'Agriculture Officer (BS-17) | PPSC Preparation',
        code: 'AO-BS17',
        school: 'School of Agriculture',
        description: 'Complete syllabus coverage for Agriculture Officer (BS-17) competitive test, focusing on agronomy, plant pathology, entomology, and agricultural economics.',
        featuredOnHomepage: true,
      },
      {
        tenantId: 'cszone',
        name: 'Assistant Director (BS-18) | PPSC Preparation',
        code: 'AD-BS18',
        school: 'School of Agriculture',
        description: 'Specialized executive prep track for Assistant Director (BS-18) selection exams, featuring high-yield study materials, past paper analysis, and mock tests.',
        featuredOnHomepage: true,
      },
    ];

    for (const prog of newPrograms) {
      await Program.create(prog);
      console.log(`✅ Created Program: ${prog.name}`);
    }

    console.log('🎉 Programs created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding programs:', err);
    process.exit(1);
  }
}

seedPrograms();
