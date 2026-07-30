const Assessment = require('../models/Assessment');
const StudentAssessment = require('../models/StudentAssessment');
const eventBus = require('../utils/eventBus');

class AssessmentService {
  async defineAssessment(courseOfferingId, assessmentTypeId, weight, maximumMarks, dueDate) {
    const existingAssessments = await Assessment.find({ courseOfferingId });
    const currentTotalWeight = existingAssessments.reduce((sum, a) => sum + a.weight, 0);
    
    if (currentTotalWeight + weight > 100) {
      throw new Error(`Total assessment weight cannot exceed 100%. Current total is ${currentTotalWeight}%.`);
    }

    const assessment = new Assessment({
      courseOfferingId,
      assessmentTypeId,
      weight,
      maximumMarks,
      dueDate
    });
    await assessment.save();
    eventBus.emit('assessment.created', { assessmentId: assessment._id });
    return assessment;
  }

  async recordScores(assessmentId, scoresData) {
    // scoresData is an array of { studentId, score }
    const records = [];
    for (const data of scoresData) {
      // Use upsert to update or insert
      const record = await StudentAssessment.findOneAndUpdate(
        { assessmentId, studentId: data.studentId },
        { score: data.score },
        { upsert: true, returnDocument: 'after' }
      );
      records.push(record);
    }
    eventBus.emit('assessment.updated', { assessmentId });
    return records;
  }
}

module.exports = new AssessmentService();
