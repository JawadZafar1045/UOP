require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../modules/auth/models/user.model');
const Course = require('../modules/lms/models/course.model');
const Program = require('../modules/lms/models/program.model');
const Major = require('../modules/lms/models/major.model');
const Quiz = require('../modules/lms/models/quiz.model');
const QuizQuestion = require('../modules/lms/models/quizQuestion.model');
const VideoLecture = require('../modules/lms/models/videoLecture.model');

function extractYouTubeId(url) {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = String(url).match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
}

const seedMajorsAndCourses = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const tenantId = (process.argv[2] || 'iub').toLowerCase();
    console.log(`Seeding for tenant: ${tenantId}`);

    // 1. Find or create instructor/admin
    let instructor = await User.findOne({ tenantId, role: { $in: ['teacher', 'admin'] } });
    if (!instructor) {
      instructor = await User.findOne({ tenantId });
    }

    // 2. Find or create BSc Agriculture program
    let program = await Program.findOne({ tenantId, code: 'BSC-AGRI' });
    if (!program) {
      program = await Program.findOne({ tenantId });
    }
    if (!program) {
      program = await Program.create({
        tenantId,
        name: 'BSc Agriculture',
        code: 'BSC-AGRI',
        school: 'School of Agriculture',
        faculty: 'Faculty of Agricultural Sciences',
        description: 'Bachelor of Science in Agriculture – 4-year undergraduate degree program.',
        degreeLevel: 'undergraduate',
        totalCreditHours: 136,
        passingGradePercent: 60,
        status: 'active',
      });
      console.log('Created Program: BSc Agriculture');
    }

    // 3. Ensure 3 Majors exist under BSc Agriculture
    const majorsData = [
      {
        name: 'Agricultural Extension',
        code: 'AGEXT',
        description: 'Agricultural communication, rural sociology, advisory methods, and community development.',
        courses: [
          {
            title: 'Agricultural Extension & Rural Sociology',
            courseCode: 'AGEXT-101',
            creditHours: 3,
            description: 'Comprehensive study of extension education systems, farmer training programs, and communication technologies in modern agriculture.',
            thumbnail: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&auto=format&fit=crop&q=60',
            topics: [
              'Introduction to Agricultural Extension Education',
              'Rural Sociology & Community Leadership',
              'ICT Tools in Agriculture Advisory Systems',
              'Program Planning & Rural Impact Evaluation'
            ],
            lectures: [
              {
                title: 'Introduction to Agricultural Extension & Communication Systems',
                moduleName: 'Module 1: Fundamentals',
                videoUrl: 'https://www.youtube.com/watch?v=0h6Q4Uv-0uI',
                durationMinutes: 24,
                description: 'Detailed lecture exploring the historical origins of extension education, technology transfer models, and communication barriers in rural farming communities.',
                notes: '• Extension Education: Non-formal education for rural people to improve livelihoods.\n• Transfer of Technology (TOT) model.\n• Adoption Curve: Innovators, Early Adopters, Early Majority, Late Majority, Laggards.',
                resources: [
                  { title: 'Extension System Reference PDF', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
                ]
              },
              {
                title: 'Digital Advisory & ICT in Modern Agriculture',
                moduleName: 'Module 2: Advisory Methods',
                videoUrl: 'https://www.youtube.com/watch?v=Bv0T8t_wKz8',
                durationMinutes: 18,
                description: 'How mobile applications, community radio broadcasts, and drone advisory systems are transforming agricultural extension services worldwide.',
                notes: '• Mass media methods vs individual farm visits.\n• Kisan Call Centers and automated SMS weather alerts.\n• Participatory Rural Appraisal (PRA) techniques.',
                resources: [
                  { title: 'ICT in Agriculture Handout', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
                ]
              }
            ],
            quiz: {
              title: 'Extension Education & Rural Development Quiz',
              instructions: 'PPSC standard pattern with negative marking (-0.25 for wrong, 0 for unattempted).',
              timeLimit: 15,
              passMark: 60,
              enableNegativeMarking: true,
              correctMark: 1,
              negativeMark: 0.25,
              unattemptedMark: 0,
              questions: [
                {
                  question: 'What is the primary objective of agricultural extension education?',
                  options: [
                    'To produce agricultural fertilizers',
                    'To transfer scientific research and technology to rural farmers',
                    'To collect rural property taxes',
                    'To manage urban landscaping projects'
                  ],
                  correctIndex: 1,
                  explanation: 'Agricultural extension bridges the gap between agricultural research institutes and farmers by transferring proven technologies, knowledge, and best practices.'
                },
                {
                  question: 'Which communication method is classified as a mass contact method in extension?',
                  options: [
                    'Farm and home visit',
                    'Method demonstration',
                    'Radio & Television broadcast',
                    'Personal office call'
                  ],
                  correctIndex: 2,
                  explanation: 'Radio, TV, newspapers, and mobile apps are mass contact methods designed to reach large heterogeneous rural audiences quickly.'
                },
                {
                  question: 'The term "Extension" originated in which educational context?',
                  options: [
                    'University Extension in the UK (Cambridge / Oxford)',
                    'Vocational Schools in Germany',
                    'Military Academies in France',
                    'Community Colleges in Canada'
                  ],
                  correctIndex: 0,
                  explanation: 'The concept of extension education originated in England around 1867 with the University Extension movement by Cambridge and Oxford Universities.'
                }
              ]
            }
          }
        ]
      },
      {
        name: 'Agronomy',
        code: 'AGRON',
        description: 'Crop production, soil fertility management, water efficiency, and sustainable farming.',
        courses: [
          {
            title: 'Principles of Agronomy & Crop Production',
            courseCode: 'AGRON-101',
            creditHours: 4,
            description: 'Core principles of crop ecology, tillage operations, seed bed preparation, weed control, and fertilizer dynamics for field crops.',
            thumbnail: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=60',
            topics: [
              'Agronomic Classification of Field Crops',
              'Tillage Practices & Conservation Farming',
              'Irrigation Scheduling & Water Productivity',
              'Integrated Weed & Nutrient Management'
            ],
            lectures: [
              {
                title: 'Crop Ecology & Photosynthetic Efficiency in Agronomy',
                moduleName: 'Module 1: Crop Ecology',
                videoUrl: 'https://www.youtube.com/watch?v=Y_VqW57lFdg',
                durationMinutes: 28,
                description: 'In-depth overview of crop growth stages, solar radiation interception, C3 vs C4 crop pathways, and thermal time units (GDD).',
                notes: '• C3 crops: Wheat, Rice, Cotton (moderate light saturation).\n• C4 crops: Maize, Sorghum, Sugarcane (high water use efficiency).\n• Growing Degree Days (GDD) formula: ((Tmax + Tmin)/2) - Tbase.',
                resources: [
                  { title: 'Agronomy Lecture Slides', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
                ]
              },
              {
                title: 'Tillage Systems, Seedbed Preparation & Soil Conservation',
                moduleName: 'Module 2: Tillage & Soil Health',
                videoUrl: 'https://www.youtube.com/watch?v=NnFk1sV3xG8',
                durationMinutes: 22,
                description: 'Comparing primary vs secondary tillage implements, conservation tillage, zero-tillage drill operations, and soil organic matter preservation.',
                notes: '• Primary Tillage: Moldboard plow, Disc plow, Chisel plow.\n• Secondary Tillage: Disc harrow, Cultivator, Rotavator.\n• Zero Tillage preserves soil structure and cuts fuel consumption by 60%.',
                resources: [
                  { title: 'Tillage Mechanics Reference', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
                ]
              }
            ],
            quiz: {
              title: 'Agronomy Fundamentals & Crop Ecology Quiz',
              instructions: 'Answer all questions. Each correct answer awards 1 mark, wrong answer deducts 0.25 marks.',
              timeLimit: 15,
              passMark: 60,
              enableNegativeMarking: true,
              correctMark: 1,
              negativeMark: 0.25,
              unattemptedMark: 0,
              questions: [
                {
                  question: 'Which of the following is considered a C4 crop with high photosynthetic efficiency?',
                  options: ['Wheat', 'Rice', 'Maize (Corn)', 'Barley'],
                  correctIndex: 2,
                  explanation: 'Maize, Sugarcane, and Sorghum are classic C4 plants having high photosynthetic water-use efficiency compared to C3 crops like Wheat and Rice.'
                },
                {
                  question: 'What is the optimal soil pH range for the availability of most plant nutrients?',
                  options: ['4.0 - 5.0', '6.0 - 7.5', '8.5 - 9.5', '2.5 - 3.5'],
                  correctIndex: 1,
                  explanation: 'A neutral to slightly acidic pH range of 6.0 to 7.5 provides the highest biological availability for primary (NPK) and secondary macro/micronutrients.'
                },
                {
                  question: 'Zero tillage (No-till) primarily benefits soil health by:',
                  options: [
                    'Increasing soil temperature drastically',
                    'Preventing soil erosion and conserving moisture & organic matter',
                    'Killing beneficial earthworms',
                    'Compacting all soil pores permanently'
                  ],
                  correctIndex: 1,
                  explanation: 'Zero tillage conserves crop residues on the soil surface, preventing wind and water erosion while conserving soil moisture and organic carbon.'
                }
              ]
            }
          }
        ]
      },
      {
        name: 'Entomology',
        code: 'ENTO',
        description: 'Insect biology, morphology, integrated pest management (IPM), and biological control.',
        courses: [
          {
            title: 'Applied Entomology & Pest Management (IPM)',
            courseCode: 'ENTO-101',
            creditHours: 4,
            description: 'Study of insect taxonomy, economically important agricultural pests, beneficial predators, and eco-friendly Integrated Pest Management strategies.',
            thumbnail: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=800&auto=format&fit=crop&q=60',
            topics: [
              'Insect Anatomy, Physiology & Metamorphosis',
              'Economic Injury Levels (EIL) and ETL Concepts',
              'Biological Control Agents & Parasitoids',
              'Safe Chemical & Botanical Insecticide Applications'
            ],
            lectures: [
              {
                title: 'Insect Anatomy, Morphology & Classification',
                moduleName: 'Module 1: Insect Anatomy',
                videoUrl: 'https://www.youtube.com/watch?v=W0F1QfXk-44',
                durationMinutes: 25,
                description: 'Comprehensive study of insect exoskeleton, tagmatization, sensory antennae, mouthparts, and wing modifications.',
                notes: '• Three Tagmata: Head (sensory), Thorax (locomotion with 3 pairs of legs), Abdomen (digestive/reproductive).\n• Metamorphosis: Holometabolous (complete) vs Hemimetabolous (incomplete).\n• Major orders: Coleoptera, Lepidoptera, Diptera, Hemiptera.',
                resources: [
                  { title: 'Insect Anatomy Diagram Sheet', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
                ]
              },
              {
                title: 'Integrated Pest Management (IPM) & Biological Predators',
                moduleName: 'Module 2: IPM Strategies',
                videoUrl: 'https://www.youtube.com/watch?v=Z61YjI6tqFk',
                durationMinutes: 30,
                description: 'Principles of threshold-based pest control, biological predators, pheromone traps, and minimizing chemical pesticide residues in agricultural food chains.',
                notes: '• ETL vs EIL: Action taken at ETL to prevent pest reaching EIL.\n• Bio-control agents: Trichogramma parasitoids, Chrysoperla carnea (Green lacewing), Coccinellids.\n• Pheromone sticky traps for monitoring bollworms.',
                resources: [
                  { title: 'IPM Field Manual PDF', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
                ]
              }
            ],
            quiz: {
              title: 'Entomology & Pest Management Quiz',
              instructions: 'PPSC Pattern Quiz with complete answer explanations and negative marking.',
              timeLimit: 15,
              passMark: 60,
              enableNegativeMarking: true,
              correctMark: 1,
              negativeMark: 0.25,
              unattemptedMark: 0,
              questions: [
                {
                  question: 'In Integrated Pest Management (IPM), the Economic Threshold (ETL) is defined as:',
                  options: [
                    'The lowest population density that causes economic damage',
                    'The pest density at which management action should be taken to prevent reaching EIL',
                    'The complete extinction point of the insect species',
                    'The minimum amount of chemical insecticide permitted by law'
                  ],
                  correctIndex: 1,
                  explanation: 'Economic Threshold (ETL), or action threshold, is the pest population level where control measures must be initiated to prevent the population from reaching the Economic Injury Level (EIL).'
                },
                {
                  question: 'Ladybird beetles (Coccinellidae) are well known in agriculture as beneficial predators of:',
                  options: ['Aphids and soft-bodied insects', 'Mature wheat stems', 'Potato tubers underground', 'Stored grain silos'],
                  correctIndex: 0,
                  explanation: 'Both adult and larval ladybird beetles are voracious biological predators of destructive aphids, scale insects, and mealybugs.'
                },
                {
                  question: 'How many body regions (tagmata) does an adult insect typically possess?',
                  options: ['Two (Cephalothorax and Abdomen)', 'Three (Head, Thorax, and Abdomen)', 'Four regions', 'One unified body segment'],
                  correctIndex: 1,
                  explanation: 'Adult insects have their bodies segmented into three distinct functional tagmata: Head (sensory/feeding), Thorax (locomotion - 3 pairs of legs & wings), and Abdomen (digestion/reproduction).'
                }
              ]
            }
          }
        ]
      }
    ];

    // Find all students of this tenant
    const students = await User.find({ tenantId, role: 'student' });
    const studentIds = students.map(s => s._id);

    for (const majInfo of majorsData) {
      let major = await Major.findOne({ tenantId, programId: program._id, code: majInfo.code });
      if (!major) {
        major = await Major.findOne({ tenantId, name: majInfo.name });
      }

      if (!major) {
        major = await Major.create({
          tenantId,
          programId: program._id,
          name: majInfo.name,
          code: majInfo.code,
          description: majInfo.description,
          status: 'active'
        });
        console.log(`Created Major: ${majInfo.name} (${majInfo.code})`);
      } else {
        major.programId = program._id;
        major.name = majInfo.name;
        major.code = majInfo.code;
        major.description = majInfo.description;
        await major.save();
        console.log(`Updated Major: ${majInfo.name}`);
      }

      // Create/Update the courses under this major
      for (const cData of majInfo.courses) {
        let course = await Course.findOne({ tenantId, courseCode: cData.courseCode });
        if (!course) {
          course = await Course.findOne({ tenantId, title: cData.title });
        }

        const modulesData = cData.topics.map((topic, tIdx) => ({
          title: `Module ${tIdx + 1}: ${topic}`,
          description: `Key principles, lecture notes, practical field applications and study materials for ${topic}.`,
          resources: [
            {
              title: `${topic} - Core Lecture Presentation`,
              type: 'pdf',
              url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
            },
            {
              title: `Field Demonstration Video & Practical Guide`,
              type: 'video',
              url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
            }
          ]
        }));

        if (!course) {
          course = await Course.create({
            tenantId,
            title: cData.title,
            courseCode: cData.courseCode,
            creditHours: cData.creditHours,
            description: cData.description,
            programId: program._id,
            majorId: major._id,
            isCommon: false,
            instructor: instructor?._id || null,
            enrolledStudents: studentIds,
            status: 'active',
            coverImage: cData.thumbnail,
            modules: modulesData
          });
          console.log(`Created Course for Major ${majInfo.name}: ${cData.title}`);
        } else {
          course.programId = program._id;
          course.majorId = major._id;
          course.isCommon = false;
          course.creditHours = cData.creditHours;
          course.status = 'active';
          if (studentIds.length > 0) {
            course.enrolledStudents = Array.from(new Set([...course.enrolledStudents.map(String), ...studentIds.map(String)]));
          }
          if (!course.modules || course.modules.length === 0) {
            course.modules = modulesData;
          }
          await course.save();
          console.log(`Updated Course for Major ${majInfo.name}: ${cData.title}`);
        }

        // Seed Video Lectures for this course
        if (cData.lectures && cData.lectures.length > 0) {
          for (let lIdx = 0; lIdx < cData.lectures.length; lIdx++) {
            const lec = cData.lectures[lIdx];
            let videoDoc = await VideoLecture.findOne({ tenantId, courseId: course._id, title: lec.title });
            const ytId = extractYouTubeId(lec.videoUrl);
            
            if (!videoDoc) {
              await VideoLecture.create({
                tenantId,
                courseId: course._id,
                createdBy: instructor?._id || null,
                title: lec.title,
                moduleName: lec.moduleName,
                videoUrl: lec.videoUrl,
                youtubeVideoId: ytId,
                durationMinutes: lec.durationMinutes,
                description: lec.description,
                notes: lec.notes,
                order: lIdx + 1,
                resources: lec.resources || [],
                isPublished: true
              });
              console.log(`  + Created Video Lecture: ${lec.title}`);
            } else {
              videoDoc.videoUrl = lec.videoUrl;
              videoDoc.youtubeVideoId = ytId;
              videoDoc.durationMinutes = lec.durationMinutes;
              videoDoc.description = lec.description;
              videoDoc.notes = lec.notes;
              videoDoc.resources = lec.resources || [];
              await videoDoc.save();
              console.log(`  * Updated Video Lecture: ${lec.title}`);
            }
          }
        }

        // Seed Quiz with Explanations for this course
        if (cData.quiz) {
          let quiz = await Quiz.findOne({ tenantId, courseId: course._id, title: cData.quiz.title });
          if (!quiz) {
            quiz = await Quiz.create({
              tenantId,
              courseId: course._id,
              createdBy: instructor?._id || null,
              title: cData.quiz.title,
              instructions: cData.quiz.instructions,
              timeLimit: cData.quiz.timeLimit,
              passMark: cData.quiz.passMark,
              maxAttempts: 3,
              shuffleQuestions: false,
              showResultImmediately: true,
              enableNegativeMarking: cData.quiz.enableNegativeMarking,
              correctMark: cData.quiz.correctMark,
              negativeMark: cData.quiz.negativeMark,
              unattemptedMark: cData.quiz.unattemptedMark,
              status: 'published'
            });

            const questionDocs = cData.quiz.questions.map((q, qIdx) => ({
              tenantId,
              quizId: quiz._id,
              question: q.question,
              options: q.options,
              correctIndex: q.correctIndex,
              explanation: q.explanation,
              marks: 1,
              order: qIdx + 1
            }));

            await QuizQuestion.insertMany(questionDocs);
            console.log(`Created Quiz for Course: ${cData.quiz.title} (${questionDocs.length} questions)`);
          }
        }
      }
    }

    console.log('\n======================================================');
    console.log(`✅ MAJORS, VIDEO LECTURES & COURSES SEEDED FOR '${tenantId}'`);
    console.log('======================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding majors and courses:', error);
    process.exit(1);
  }
};

seedMajorsAndCourses();
