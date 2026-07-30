const csv = require('csv-parser');
const fs = require('fs');
const mongoose = require('mongoose');
const StudentAssessment = require('../models/StudentAssessment');
const StudentProfile = require('../models/StudentProfile');

class ImportService {
  async parseCSV(filePath) {
    const results = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  async validateAssessmentScores(csvData, assessmentId) {
    const errors = [];
    const validData = [];
    // Assuming CSV has columns: registrationNumber, score
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const regNum = row.registrationNumber;
      const score = parseFloat(row.score);
      
      if (!regNum || isNaN(score)) {
        errors.push(`Row ${i + 1}: Invalid data format`);
        continue;
      }
      
      // Need to find studentId from User -> StudentProfile
      const User = require('../models/User');
      const user = await User.findOne({ loginIdentifier: regNum, role: 'Student' });
      if (!user) {
        errors.push(`Row ${i + 1}: Student with Reg Number ${regNum} not found`);
        continue;
      }
      
      const student = await StudentProfile.findOne({ userId: user._id });
      if (!student) {
        errors.push(`Row ${i + 1}: Student profile not found for ${regNum}`);
        continue;
      }

      validData.push({ studentId: student._id, score, regNum });
    }

    return { errors, validData };
  }

  async importAssessmentScores(validData, assessmentId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      for (const data of validData) {
        await StudentAssessment.findOneAndUpdate(
          { assessmentId, studentId: data.studentId },
          { score: data.score },
          { upsert: true, returnDocument: 'after', session }
        );
      }
      await session.commitTransaction();
      session.endSession();
      
      const eventBus = require('../utils/eventBus');
      eventBus.emit('assessment.updated', { assessmentId });
      
      return { success: true, count: validData.length };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}

module.exports = new ImportService();
