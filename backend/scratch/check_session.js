const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const Session = require(path.join(__dirname, '../modules/lms/models/session.model'));

async function checkSession() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const sessions = await Session.find({ courseId: '69fb1b6ddc034f87c082d5d8' });
    console.log('Sessions:', JSON.stringify(sessions.map(s => ({
      _id: s._id,
      title: s.title,
      isOpen: s.isOpen,
      attendanceCloseAt: s.attendanceCloseAt
    })), null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSession();
