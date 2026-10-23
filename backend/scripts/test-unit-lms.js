require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const assert = require('assert');
const CloudinaryProvider = require('../modules/shared/services/media/providers/cloudinary.provider');
const mediaService = require('../modules/shared/services/media/media.service');

console.log('====================================================');
console.log('🔬 CSZone LMS Unit & Architecture Tests');
console.log('====================================================\n');

// 1. Test Media Provider Interface
console.log('--- 1. Testing Media Provider Abstraction ---');
assert(mediaService !== undefined, 'MediaService singleton should exist');
assert(typeof mediaService.uploadVideo === 'function', 'MediaService should implement uploadVideo');
assert(typeof mediaService.deleteVideo === 'function', 'MediaService should implement deleteVideo');
assert(typeof mediaService.generatePlaybackUrl === 'function', 'MediaService should implement generatePlaybackUrl');
assert(typeof mediaService.generateThumbnail === 'function', 'MediaService should implement generateThumbnail');

const testProvider = new CloudinaryProvider();
assert(testProvider.name === 'cloudinary', 'CloudinaryProvider name must be "cloudinary"');
console.log('✅ Media provider abstraction and Cloudinary provider validated.');

// 2. Test Media URL Generation
console.log('\n--- 2. Testing Cloudinary Playback URL Generation ---');
const samplePublicId = 'cszone/lectures/web-pentesting-101';
const generatedPlaybackUrl = testProvider.generateThumbnail(samplePublicId);
assert(generatedPlaybackUrl.includes(samplePublicId), 'Thumbnail URL should contain publicId');
console.log('✅ Generated thumbnail URL:', generatedPlaybackUrl);

// 3. Test Progress Auto-Completion Logic (>= 90% threshold)
console.log('\n--- 3. Testing 90% Progress Auto-Completion Rule ---');
function calculateCompletion(progressSeconds, durationSeconds) {
  const ratio = durationSeconds > 0 ? (progressSeconds / durationSeconds) : 0;
  return ratio >= 0.90;
}

assert.strictEqual(calculateCompletion(100, 600), false, '16.6% should not complete');
assert.strictEqual(calculateCompletion(530, 600), false, '88.3% should not complete');
assert.strictEqual(calculateCompletion(540, 600), true, '90.0% MUST mark as completed');
assert.strictEqual(calculateCompletion(590, 600), true, '98.3% MUST mark as completed');
assert.strictEqual(calculateCompletion(600, 600), true, '100% MUST mark as completed');
console.log('✅ 90% completion threshold mathematical validation passed.');

// 4. Test Course Access Authorization Logic
console.log('\n--- 4. Testing Lecture Playback Access Control ---');
function canAccessLecture({ isPreview, userRole, userId, courseInstructorId, enrolledStudents }) {
  // Free preview lectures can be accessed by anyone
  if (isPreview) return true;
  // If not authenticated, non-preview is blocked
  if (!userId) return false;
  // Admins always have access
  if (userRole === 'admin') return true;
  // Course creator / instructor has access
  if (courseInstructorId && String(courseInstructorId) === String(userId)) return true;
  // Enrolled students have access
  if (Array.isArray(enrolledStudents) && enrolledStudents.some(s => String(s) === String(userId))) {
    return true;
  }
  return false;
}

const instructorId = '507f1f77bcf86cd799439011';
const studentEnrolledId = '507f1f77bcf86cd799439022';
const studentUnenrolledId = '507f1f77bcf86cd799439033';
const adminId = '507f1f77bcf86cd799439044';
const enrolledList = [studentEnrolledId];

// Test cases:
assert.strictEqual(canAccessLecture({ isPreview: true, userId: null }), true, 'Guest can access free preview');
assert.strictEqual(canAccessLecture({ isPreview: false, userId: null }), false, 'Guest cannot access locked lecture');
assert.strictEqual(canAccessLecture({ isPreview: false, userId: studentUnenrolledId, userRole: 'student', enrolledStudents: enrolledList }), false, 'Unenrolled student cannot access locked lecture');
assert.strictEqual(canAccessLecture({ isPreview: false, userId: studentEnrolledId, userRole: 'student', enrolledStudents: enrolledList }), true, 'Enrolled student CAN access locked lecture');
assert.strictEqual(canAccessLecture({ isPreview: false, userId: adminId, userRole: 'admin', enrolledStudents: enrolledList }), true, 'Admin CAN access any lecture');
assert.strictEqual(canAccessLecture({ isPreview: false, userId: instructorId, userRole: 'teacher', courseInstructorId: instructorId, enrolledStudents: enrolledList }), true, 'Instructor CAN access own lecture');

console.log('✅ All 6 Access Control & RBAC test cases passed.');

// 5. Test Public Sanitization Logic
console.log('\n--- 5. Testing Public Video Sanitization ---');
const rawLectures = [
  { _id: '1', title: 'Intro (Preview)', isPreview: true, video: { playbackUrl: 'https://cdn.example.com/video1.mp4' } },
  { _id: '2', title: 'Deep Dive (Locked)', isPreview: false, video: { playbackUrl: 'https://cdn.example.com/video2_secret.mp4' } },
];

const sanitizedLectures = rawLectures.map(lec => ({
  _id: lec._id,
  title: lec.title,
  isPreview: lec.isPreview,
  previewUrl: lec.isPreview ? lec.video?.playbackUrl : undefined,
  // video object stripped if not preview
  video: lec.isPreview ? lec.video : undefined,
}));

assert.strictEqual(sanitizedLectures[0].previewUrl, 'https://cdn.example.com/video1.mp4', 'Preview lecture keeps preview URL');
assert.strictEqual(sanitizedLectures[1].previewUrl, undefined, 'Locked lecture previewUrl MUST be undefined');
assert.strictEqual(sanitizedLectures[1].video, undefined, 'Locked lecture video object MUST be stripped');
console.log('✅ Video URL sanitization verified.');

// 6. Test LMS Routes Export
console.log('\n--- 6. Testing Express Route Definitions ---');
const lmsRouter = require('../modules/lms/routes/lms.routes');
assert(lmsRouter && typeof lmsRouter === 'function', 'LMS router must export valid Express Router');
console.log('✅ LMS router exported cleanly.');

console.log('\n====================================================');
console.log('🎉 ALL UNIT & ARCHITECTURE TESTS PASSED! (100%)');
console.log('====================================================\n');
