/**
 * CSZone Course Seed Script
 * Inserts all courses directly into MongoDB — bypasses admin UI.
 *
 * Run locally:  node scripts/seed-courses.js
 * Run on VPS:   node scripts/seed-courses.js
 *
 * All courses:  Paid Track · PKR 50,000 · Status: Published
 * Thumbnails:   Left blank — upload via Admin UI after running this
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// ─────────────────────────────────────────────────────────────────────────────
// COURSE DATA
// ─────────────────────────────────────────────────────────────────────────────
const COURSES = [

  // ══════════════════════════════════════════════════════════════════
  // CERTIFICATION BOOTCAMP
  // ══════════════════════════════════════════════════════════════════

  {
    title: 'CompTIA Security+ Certification Bootcamp',
    slug: 'comptia-security-plus-bootcamp',
    category: 'Certification Bootcamp',
    shortDescription: 'Accelerate your IT career. This intensive bootcamp prepares you to pass the CompTIA Security+ (SY0-701) exam and master hands-on security fundamentals.',
    description: `This high-intensity bootcamp is designed to cut through the fluff and get you exam-ready in record time. CompTIA Security+ is the most widely recognized entry-level certification, required by the Department of Defense (DoD) and thousands of private employers. We combine official CompTIA curriculum with real-world lab simulations, ensuring you don't just memorize answers but understand the core principles of risk management, cryptography, and network defense. This bootcamp includes exam vouchers, practice tests, and post-training support.`,
    whatYouWillLearn: [
      'Threats, Attacks, and Vulnerabilities (Malware, Social Engineering, App Attacks)',
      'Architecture and Design (Secure network design, Cloud, Virtualization)',
      'Implementation (Identity and Access Management, PKI, Wireless Security)',
      'Operations and Incident Response (Digital Forensics, Disaster Recovery)',
      'Governance, Risk, and Compliance (Policies, Laws, GDPR, Privacy)',
      'How to pass the SY0-701 exam with proven test-taking strategies',
    ],
  },

  {
    title: 'Certified Cloud Security Professional (CCSP) Bootcamp',
    slug: 'ccsp-bootcamp',
    category: 'Certification Bootcamp',
    shortDescription: 'Become a leader in cloud security. This bootcamp covers advanced cloud architecture, data protection, and compliance for multi-cloud environments.',
    description: `As organizations rapidly migrate to the cloud, the demand for CCSP-certified professionals has skyrocketed. Co-created by (ISC)² and CSA, this certification validates your ability to design, manage, and secure cloud infrastructure at an enterprise level. This bootcamp dives deep into the shared responsibility model, cloud data encryption, virtualization security, and legal/compliance issues specific to the cloud. You will learn to bridge the gap between business stakeholders and technical cloud teams.`,
    whatYouWillLearn: [
      'Cloud Concepts, Architecture, and Design (NIST, CSA, ISO standards)',
      'Cloud Data Security (Data lifecycle, Encryption, Tokenization, DLP)',
      'Cloud Platform & Infrastructure Security (Securing compute, storage, and networks)',
      'Cloud Application Security (DevSecOps, CI/CD pipelines, API security)',
      'Cloud Security Operations (Change management, Disaster Recovery, Forensics)',
      'Legal, Risk, and Compliance (Audit frameworks, eDiscovery, Contract management)',
    ],
  },

  {
    title: 'Certified Information Security Manager (CISM) Bootcamp',
    slug: 'cism-bootcamp',
    category: 'Certification Bootcamp',
    shortDescription: 'Transition from technical expert to security manager. CISM bridges the gap between IT security and business strategy.',
    description: `If you are looking to move into leadership, CISM is the certification for you. Unlike technical exams, CISM focuses on the management of security programs. This bootcamp teaches you how to align security initiatives with business goals, manage risk appetite, and build high-performing security teams. Developed by ISACA, CISM is globally recognized for Information Security Managers, CISOs, and IT Directors who need to speak the language of both the boardroom and the server room.`,
    whatYouWillLearn: [
      'Information Security Governance (Strategy, policies, and organizational structure)',
      'Information Risk Management (Risk assessment, classification, and treatment)',
      'Security Program Development and Management (Building and managing security teams)',
      'Incident Management and Response (Business continuity, disaster recovery, and crisis communication)',
      'How to measure and report security ROI to executive stakeholders',
      'Passing strategies for the ISACA CISM exam',
    ],
  },

  {
    title: 'Certified Information Systems Security Professional (CISSP) Bootcamp',
    slug: 'cissp-bootcamp',
    category: 'Certification Bootcamp',
    shortDescription: 'Validate your expertise at the highest level. This intensive bootcamp covers all eight domains of the CISSP Common Body of Knowledge (CBK).',
    description: `The CISSP is arguably the most prestigious certification in the cybersecurity industry. Designed for experienced professionals (minimum 5 years in the field), this bootcamp is a rigorous deep-dive into enterprise-level security architecture and management. We cover everything from security engineering to software development security, preparing you not just for the exam, but for the role of a senior advisor or CISO. This bootcamp features intensive review sessions, practice exams, and domain-specific labs.`,
    whatYouWillLearn: [
      'Security and Risk Management (Confidentiality, Integrity, Availability, Governance)',
      'Asset Security (Data classification, Privacy, Retention)',
      'Security Architecture and Engineering (Cryptography, Physical security, Security models)',
      'Communication and Network Security (OSI model, Secure protocols, Network attacks)',
      'Identity and Access Management (IAM) (Authentication methods, Federation, SSO)',
      'Security Assessment and Testing (Vulnerability assessment, Penetration testing, Audits)',
      'Security Operations (Incident response, Disaster recovery, BCP, Forensics)',
      'Software Development Security (Secure SDLC, DevSecOps, Code reviews)',
    ],
  },

  {
    title: 'CEH Master Certification Bootcamp',
    slug: 'ceh-master-bootcamp',
    category: 'Certification Bootcamp',
    shortDescription: 'Go beyond the written exam. CEH Master validates your ability to execute real-world cyber attacks in a live, proctored environment.',
    description: `This is not just another multiple-choice bootcamp. The CEH Master credential requires you to pass the CEH Practical exam, a 6-hour marathon where you must demonstrate live hacking skills against a range of targets. This bootcamp is built entirely around practical labs — exploiting web servers, compromising Active Directory, pivoting through networks, and evading detection. We transform you from a "paper-certified" professional into a true penetration tester who can deliver results in the field.`,
    whatYouWillLearn: [
      'Advanced foothold and persistence techniques',
      'Active Directory attacks (Kerberoasting, Pass-the-Hash, Golden Ticket)',
      'Web server and web application exploitation (Tomcat, IIS, OWASP Top 10)',
      'Cloud computing exploitation (AWS/Azure misconfigurations)',
      'Mobile and IoT hacking fundamentals',
      'How to approach and pass the 6-hour CEH Practical exam with confidence',
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // CUSTOMIZED TRAINING
  // ══════════════════════════════════════════════════════════════════

  {
    title: 'Customized Cyber Security Training',
    slug: 'customized-cyber-security-training',
    category: 'Customized Training',
    shortDescription: 'One-size-fits-all doesn\'t work for security. We build custom training modules around your company\'s tech stack, policies, and unique threat landscape.',
    description: `Generic training often fails to address the specific vulnerabilities of your organization. This service is an engagement, not a pre-packaged course. Our senior instructors will conduct a brief assessment of your environment and then craft a bespoke curriculum. Whether you need secure coding training for your developers, phishing awareness for your finance team, or advanced SOC training for your analysts, we align the content with your actual infrastructure — for example, "This is how we protect our Azure tenant".`,
    whatYouWillLearn: [
      'Specific mitigation strategies for threats facing your industry',
      'Hands-on exercises using your tools (SIEM, EDR, Firewalls)',
      'Secure code review aligned with your development languages',
      'Incident response drills simulating attacks relevant to your business',
      'Building a security-first culture within your departments',
      'Phishing awareness, social engineering defense, and insider threat prevention',
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // LAW ENFORCEMENT AGENCIES
  // ══════════════════════════════════════════════════════════════════

  {
    title: 'Tracking the Criminal in Cyber Space',
    slug: 'tracking-criminal-cyber-space',
    category: 'Law Enforcement Agencies',
    shortDescription: 'Equip law enforcement with the tools to trace digital footprints, unmask anonymous actors, and build cyber-crime cases.',
    description: `This specialized course is designed for police officers, detectives, and cyber-crime investigators. It bridges the gap between technical digital forensics and traditional investigative techniques. You will learn advanced Open-Source Intelligence (OSINT) methods to track suspects, analyze IP address geolocation, and understand how to work with ISPs to obtain subscriber information. The course emphasizes legal standards, evidence chain of custody, and courtroom presentation.`,
    whatYouWillLearn: [
      'Utilizing OSINT tools to identify real-world identities from online pseudonyms',
      'IP address tracing, geolocation, and understanding VPN/TOR limitations',
      'Analyzing email headers and metadata to identify spoofing',
      'Intelligence gathering from the Deep Web and Surface Web',
      'Understanding cryptocurrency tracing (Bitcoin, Monero) for ransom cases',
      'Proper legal procedures for digital evidence collection',
    ],
  },

  {
    title: 'Dark Web Analysis',
    slug: 'dark-web-analysis-law-enforcement',
    category: 'Law Enforcement Agencies',
    shortDescription: 'Safely access, navigate, and analyze the Dark Web to identify illegal marketplaces, terrorist communications, and data breaches.',
    description: `The Dark Web is a haven for criminal activity, from drug trafficking to stolen credit card markets. This course teaches law enforcement personnel how to set up a secure and anonymous operational environment to conduct undercover investigations. You will learn how to interpret .onion addresses, navigate marketplaces, understand threat actor jargon, and legally interact with sources while maintaining operational security (OpSec) and personal safety.`,
    whatYouWillLearn: [
      'Setting up a secure Tails OS and VPN infrastructure for investigators',
      'Navigating Tor and I2P networks safely',
      'Identifying major dark web marketplaces and illicit forums',
      'Using dark web scanners to monitor for breached organizational data',
      'Understanding the ransomware ecosystem and negotiation strategies',
      'Legal and ethical boundaries for undercover digital operations',
    ],
  },

  {
    title: 'Social Media Forensics',
    slug: 'social-media-forensics-law-enforcement',
    category: 'Law Enforcement Agencies',
    shortDescription: 'Master the art of collecting, preserving, and analyzing evidence from social media platforms and encrypted messaging apps.',
    description: `Social media is a digital treasure trove of evidence, providing timestamps, locations, associations, and behavioral patterns of suspects and victims. This practical course teaches law enforcement and corporate investigators how to legally scrape data from platforms like Facebook, Instagram, WhatsApp, and Telegram. You will learn how to authenticate social media evidence for court, analyze digital timelines, and use specialized tools to capture ephemeral content before it disappears.`,
    whatYouWillLearn: [
      'Legal guidelines for social media evidence collection (FRCP, consent, warrants)',
      'Automated scraping and archiving of social media profiles and posts',
      'Mapping social networks to identify criminal associations',
      'Analyzing metadata from images and videos posted online',
      'Extracting data from messaging apps (WhatsApp, Signal, Telegram) from devices',
      'Presenting digital evidence effectively in court cases',
    ],
  },

  {
    title: 'Mobile Forensics',
    slug: 'mobile-forensics-law-enforcement',
    category: 'Law Enforcement Agencies',
    shortDescription: 'Unlock the secrets within mobile devices. Learn physical, logical, and file-system extraction techniques for iOS and Android.',
    description: `Mobile phones are the most critical source of evidence in modern investigations. This course provides law enforcement and forensic analysts with hands-on training in using industry-standard tools (like Cellebrite, XRY, or Magnet AXIOM) to extract data from locked devices. You will learn to bypass screen locks, recover deleted text messages, analyze location history (GPS/Wi-Fi), and understand app-level forensics (WhatsApp, Telegram, Uber). The course strictly adheres to legal standards to ensure evidence is admissible in court.`,
    whatYouWillLearn: [
      'Physical vs. Logical vs. File-System extraction techniques',
      'Overcoming iOS and Android lock screens',
      'Recovering deleted data (SMS, Call Logs, Photos, Documents)',
      'Analyzing GPS, Wi-Fi, and Cell Tower location data',
      'Forensic analysis of 3rd-party applications (Messaging, Dating, Banking apps)',
      'Maintaining proper chain of custody and writing expert forensic reports',
    ],
  },

];

// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  if (!MONGO_URI) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected!\n');

  const CourseColl = mongoose.connection.collection('courses');

  // Auto-detect tenantId from existing courses
  const sample = await CourseColl.findOne({ tenantId: { $exists: true, $ne: null } });
  const tenantId = sample?.tenantId || 'cszone';
  console.log(`🏷️  Using tenantId: ${tenantId}\n`);

  let inserted = 0;
  let skipped  = 0;

  for (const c of COURSES) {
    const exists = await CourseColl.findOne({ slug: c.slug });
    if (exists) {
      console.log(`⏭️  SKIP   "${c.title}" (slug already exists)`);
      skipped++;
      continue;
    }

    const now = new Date();
    await CourseColl.insertOne({
      tenantId,
      title:            c.title,
      slug:             c.slug,
      category:         c.category,
      shortDescription: c.shortDescription,
      description:      c.description,
      whatYouWillLearn: c.whatYouWillLearn,

      // Pricing — all paid at PKR 50,000
      type:     'paid',
      price:    50000,
      currency: 'PKR',

      // Defaults
      level:      'Beginner',
      duration:   'Self-paced',
      status:     'published',
      isFeatured: false,
      thumbnail:  '',
      tags:       [],

      // Completion criteria
      completionCriteria: {
        minAttendancePercent: 75,
        minAssignmentScore:   60,
        minQuizScore:         60,
      },

      // Empty collections
      stats:            { sessions: 0, assignments: 0, quizzes: 0 },
      enrolledStudents: [],
      modules:          [],

      createdAt: now,
      updatedAt: now,
    });

    console.log(`✅ CREATED "${c.title}" → [${c.category}] · PKR 50,000`);
    inserted++;
  }

  console.log('\n══════════════════════════════════════');
  console.log(`✅ Inserted : ${inserted} courses`);
  console.log(`⏭️  Skipped  : ${skipped} courses (already exist)`);
  console.log('══════════════════════════════════════');
  console.log('🎉 All done! Now upload thumbnails via Admin → Courses.\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
