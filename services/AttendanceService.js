const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const eventBus = require('../utils/eventBus');

class AttendanceService {
  async createSession(courseOfferingId, week, lectureDate, topic) {
    const session = new AttendanceSession({
      courseOfferingId,
      week,
      lectureDate,
      topic
    });
    await session.save();
    return session;
  }

  async recordAttendance(attendanceSessionId, recordsData) {
    // recordsData is an array of { studentId, isPresent }
    const records = [];
    for (const data of recordsData) {
      const record = new AttendanceRecord({
        attendanceSessionId,
        studentId: data.studentId,
        isPresent: data.isPresent
      });
      await record.save();
      records.push(record);
    }
    
    eventBus.emit('attendance.recorded', { attendanceSessionId });
    return records;
  }
}

module.exports = new AttendanceService();
