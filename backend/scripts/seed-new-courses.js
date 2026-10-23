/**
 * CS Zone Academy - New Courses Seed Script
 * Inserts the 5 new cybersecurity and AI security courses into MongoDB:
 *  1. ISC2 Certified in Cybersecurity (CC) Preparation
 *  2. Practical SOC Analyst - Level 1
 *  3. CompTIA SecAI+ (CY0-001) Preparation
 *  4. TryHackMe AI Security (AI1) Preparation
 *  5. AI Security Professional Bundle
 *
 * Run locally / server:
 *   cd UOP/backend
 *   node scripts/seed-new-courses.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const NEW_COURSES = [
  // ─────────────────────────────────────────────────────────────────────────────
  // 01. ISC2 Certified in Cybersecurity (CC) Preparation
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: 'ISC2 Certified in Cybersecurity (CC) Preparation',
    slug: 'isc2-certified-in-cybersecurity-cc',
    category: 'Certification Bootcamp',
    level: 'Beginner',
    duration: 'To be confirmed',
    type: 'paid',
    price: 0, // Fee to be confirmed
    currency: 'PKR',
    status: 'published',
    isPublished: true,
    isFeatured: true,
    thumbnail: 'https://res.cloudinary.com/dtyz5vwpf/image/upload/v1792739523/uop_course_thumbnails/isc2-certified-in-cybersecurity-cc_1792739522116.jpg',
    shortDescription:
      'Build a strong foundation in cybersecurity and prepare for the ISC2 Certified in Cybersecurity (CC) examination. Designed for students, fresh graduates and professionals beginning their cybersecurity careers.',
    description: `### Course Overview
This preparation course introduces essential cybersecurity principles, common threats, access controls, risk management, network security and security operations. Learners gain an understanding of how organizations protect information and develop the foundational knowledge needed for the ISC2 CC examination.

### Who Should Attend
Designed for students, fresh graduates, early-career IT professionals, and career changers looking to start in cybersecurity.

### Prerequisites
No prior cybersecurity work experience is required; basic computer literacy is recommended.

### Schedule & Pricing Note
- **Duration & Classes:** To be confirmed
- **Training Fee:** To be confirmed
- **Certification Exam:** Note that third-party exam vouchers/fees are separate and governed by ISC2.`,
    whatYouWillLearn: [
      'Understand essential cybersecurity principles and best practices.',
      'Recognize common security threats and organizational risks.',
      'Build foundational knowledge of access management, networks and incident response.',
      'Develop the knowledge needed to prepare for the ISC2 CC examination.',
    ],
    tags: ['ISC2', 'CC', 'Cybersecurity Fundamentals', 'Certification Bootcamp', 'Security Operations'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 02. Practical SOC Analyst - Level 1
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: 'Practical SOC Analyst - Level 1',
    slug: 'practical-soc-analyst-level-1',
    category: 'Specialized Courses',
    level: 'Beginner to Intermediate',
    duration: 'To be confirmed',
    type: 'paid',
    price: 0, // Fee to be confirmed
    currency: 'PKR',
    status: 'published',
    isPublished: true,
    isFeatured: true,
    thumbnail: 'https://res.cloudinary.com/dtyz5vwpf/image/upload/v1792739524/uop_course_thumbnails/practical-soc-analyst-level-1_1792739524301.jpg',
    shortDescription:
      'Develop hands-on skills for entry-level Security Operations Center (SOC) roles. Learn security monitoring, alert triage, log analysis, threat identification and incident reporting.',
    description: `### Course Overview
This practical training introduces the day-to-day workflows of SOC teams. Participants learn how security alerts are monitored and investigated, how suspicious events are prioritized and how incident findings are documented. Guided exercises emphasize defensive security monitoring, SIEM fundamentals and effective escalation.

### Who Should Attend
Cybersecurity students, network and IT administrators, and aspiring SOC analysts.

### Prerequisites
Basic knowledge of operating systems, computer networks, and cybersecurity is recommended.

### Schedule & Pricing Note
- **Duration & Classes:** To be confirmed
- **Training Fee:** To be confirmed`,
    whatYouWillLearn: [
      'Understand SOC workflows and security alert triage.',
      'Recognize suspicious events in common security logs.',
      'Explore SIEM operations, threat intelligence and investigation techniques.',
      'Prepare clear incident reports and support security response activities.',
    ],
    tags: ['SOC Analyst', 'SIEM', 'Threat Detection', 'Alert Triage', 'Log Analysis', 'Blue Team', 'Incident Response'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 03. CompTIA SecAI+ (CY0-001) Preparation
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: 'CompTIA SecAI+ (CY0-001) Preparation',
    slug: 'comptia-secai-plus-cy0-001',
    category: 'Certification Bootcamp',
    level: 'Intermediate',
    duration: '12 weeks / 48 instructor-led hours (2 classes/week, 2 hrs/class)',
    type: 'paid',
    price: 29999,
    currency: 'PKR',
    status: 'published',
    isPublished: true,
    isFeatured: true,
    thumbnail: 'https://res.cloudinary.com/dtyz5vwpf/image/upload/v1792739525/uop_course_thumbnails/comptia-secai-plus-cy0-001_1792739525744.jpg',
    shortDescription:
      'Prepare for CompTIA SecAI+ (CY0-001) and build knowledge of secure AI systems, AI-related cyber threats, defensive technologies and AI governance.',
    description: `### Course Overview
Designed for cybersecurity and IT professionals, this course explores security challenges created by AI applications and how organizations can manage those risks. The training connects core concepts in AI security, operational use cases, security controls and governance with structured preparation for CompTIA SecAI+.

### Schedule & Duration
- **Duration:** 12 weeks / 48 instructor-led hours
- **Schedule:** 2 classes per week; 2 hours per class
- **Training Fee:** PKR 29,999

### Bundle Savings Option
Interested in both AI security governance and practical offensive/defensive hands-on training? Check out our [AI Security Professional Bundle](/courses/ai-security-professional-bundle) which bundles CompTIA SecAI+ and TryHackMe AI1 for PKR 49,999 (saving PKR 4,999).

### Who Should Attend
Security analysts, engineers, consultants, GRC professionals and IT practitioners.

### Prerequisites
Previous cybersecurity knowledge and practical IT experience are recommended.

### Certification Note
Training fee covers instructor-led classes and preparation. CompTIA third-party exam fees/vouchers are separate.`,
    whatYouWillLearn: [
      'Identify security risks affecting AI applications, models and data.',
      'Understand security controls and threat modeling for AI environments.',
      'Explore responsible AI use in security monitoring and cyber defense.',
      'Build awareness of AI governance, risk management and compliance.',
    ],
    tags: ['CompTIA', 'SecAI+', 'CY0-001', 'AI Security', 'Threat Modeling', 'AI Governance', 'Certification Bootcamp'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 04. TryHackMe AI Security (AI1) Preparation
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: 'TryHackMe AI Security (AI1) Preparation',
    slug: 'tryhackme-ai1-security-training',
    category: 'Certification Bootcamp',
    level: 'Intermediate',
    duration: '8 weeks / 32 instructor-led hours (2 classes/week, 2 hrs/class)',
    type: 'paid',
    price: 24999,
    currency: 'PKR',
    status: 'published',
    isPublished: true,
    isFeatured: true,
    thumbnail: 'https://res.cloudinary.com/dtyz5vwpf/image/upload/v1792739526/uop_course_thumbnails/tryhackme-ai1-security-training_1792739526464.jpg',
    shortDescription:
      'Build practical AI security assessment and defense skills with preparation for the TryHackMe AI Security (AI1) certification.',
    description: `### Course Overview
This program focuses on security risks involving AI-enabled applications. Learners explore how AI-based solutions may be exposed to prompt injection, insecure integrations, data poisoning and related weaknesses. Guided exercises emphasize responsible testing, defensive controls and practical investigation in authorized environments.

### Schedule & Duration
- **Duration:** 8 weeks / 32 instructor-led hours
- **Schedule:** 2 classes per week; 2 hours per class
- **Training Fee:** PKR 24,999

### Bundle Savings Option
Looking to combine deep governance and hands-on application security? Check out the [AI Security Professional Bundle](/courses/ai-security-professional-bundle) to get both CompTIA SecAI+ and TryHackMe AI1 for PKR 49,999 (saving PKR 4,999).

### Who Should Attend
Penetration testers, application security professionals, AI developers and cybersecurity learners.

### Prerequisites
Basic cybersecurity understanding is recommended; specialist AI knowledge is not essential.

### Platform Subscriptions Note
Third-party platform subscriptions and certification vouchers are subject to TryHackMe terms and are excluded from the training fee unless separately announced.`,
    whatYouWillLearn: [
      'Recognize security weaknesses in AI-powered applications.',
      'Understand prompt injection, RAG security and AI-related data risks.',
      'Develop practical AI security assessment and mitigation skills.',
      'Build familiarity with the practical focus of TryHackMe AI1.',
    ],
    tags: ['TryHackMe', 'AI1', 'Prompt Injection', 'RAG Security', 'AI Security Testing', 'Certification Bootcamp'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 05. AI Security Professional Bundle
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: 'AI Security Professional Bundle',
    slug: 'ai-security-professional-bundle',
    category: 'Certification Bootcamp',
    level: 'Intermediate',
    duration: '80 instructor-led hours (48 + 32) (2 classes weekly/course, 2 hrs/class)',
    type: 'paid',
    price: 49999,
    currency: 'PKR',
    status: 'published',
    isPublished: true,
    isFeatured: true,
    thumbnail: 'https://res.cloudinary.com/dtyz5vwpf/image/upload/v1792739527/uop_course_thumbnails/ai-security-professional-bundle_1792739527255.jpg',
    shortDescription:
      'Combine CompTIA SecAI+ and TryHackMe AI1 preparation in one learning pathway covering both AI security governance and hands-on AI application security.',
    description: `### Course Overview
The bundle combines two complementary programs:
1. [CompTIA SecAI+ (CY0-001) Preparation](/courses/comptia-secai-plus-cy0-001): Builds knowledge of organizational AI risk, secure deployment and cybersecurity operations.
2. [TryHackMe AI Security (AI1) Preparation](/courses/tryhackme-ai1-security-training): Develops applied assessment, defensive controls, and hands-on prompt/RAG security skills.

The two courses retain their individual learning schedules and requirements while providing an integrated comprehensive pathway.

### Bundle Pricing & Schedule
- **Bundle Training Fee:** PKR 49,999 *(Save PKR 4,999 versus enrolling separately for PKR 54,998)*
- **Total Training Duration:** 80 instructor-led hours (48 hours CompTIA SecAI+ + 32 hours TryHackMe AI1)
- **Schedule:** 2 classes weekly per course, 2 hours per class

### Who Should Attend
Cybersecurity professionals and IT practitioners seeking wider AI security capabilities across governance, defense, and hands-on assessment.

### Prerequisites
Basic cybersecurity knowledge is recommended.

### Certifications Notice
State clearly: Third-party exam fees, exam vouchers and platform subscriptions are excluded unless separately verified and approved. Training prepares learners for official examinations without implying direct provider authorization.`,
    whatYouWillLearn: [
      'Cover both operational and strategic areas of AI security.',
      'Develop knowledge of AI-related threats, controls and risk management.',
      'Strengthen practical AI application assessment and security skills.',
      'Prepare for two separate third-party certification assessments.',
    ],
    tags: ['AI Security Bundle', 'CompTIA SecAI+', 'TryHackMe AI1', 'Dual Certification', 'Certification Bootcamp'],
  },
];

async function seedNewCourses() {
  if (!MONGO_URI) {
    console.error('❌ MONGODB_URI not found in environment');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected successfully!\n');

  const CourseColl = mongoose.connection.collection('courses');

  // Auto-detect tenantId from existing courses or fallback to cszone
  const sample = await CourseColl.findOne({ tenantId: { $exists: true, $ne: null } });
  const tenantId = sample?.tenantId || 'cszone';
  console.log(`🏷️  Target tenantId: ${tenantId}\n`);

  let addedCount = 0;
  let updatedCount = 0;

  for (const course of NEW_COURSES) {
    const existing = await CourseColl.findOne({ slug: course.slug });
    const now = new Date();

    const courseDoc = {
      tenantId,
      title: course.title,
      slug: course.slug,
      category: course.category,
      level: course.level,
      duration: course.duration,
      type: course.type,
      price: course.price,
      currency: course.currency,
      status: course.status,
      isPublished: course.isPublished,
      isFeatured: course.isFeatured,
      thumbnail: course.thumbnail,
      shortDescription: course.shortDescription,
      description: course.description,
      whatYouWillLearn: course.whatYouWillLearn,
      tags: course.tags,
      completionCriteria: {
        minAttendancePercent: 75,
        minAssignmentScore: 60,
        minQuizScore: 60,
      },
      stats: { sessions: 0, assignments: 0, quizzes: 0 },
      enrolledStudents: existing?.enrolledStudents || [],
      modules: existing?.modules || [],
      updatedAt: now,
    };

    if (existing) {
      await CourseColl.updateOne({ slug: course.slug }, { $set: courseDoc });
      console.log(`🔄 UPDATED: "${course.title}" (${course.slug})`);
      updatedCount++;
    } else {
      courseDoc.createdAt = now;
      await CourseColl.insertOne(courseDoc);
      console.log(`✨ CREATED: "${course.title}" (${course.slug})`);
      addedCount++;
    }
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log(`✅ Seed Completed: ${addedCount} inserted, ${updatedCount} updated.`);
  console.log('══════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seedNewCourses().catch((err) => {
  console.error('❌ Error seeding new courses:', err);
  process.exit(1);
});

