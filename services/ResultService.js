const Result = require('../models/Result');
const Assessment = require('../models/Assessment');
const StudentAssessment = require('../models/StudentAssessment');
const GradeService = require('./GradeService');
const mongoose = require('mongoose');
const eventBus = require('../utils/eventBus');

class ResultService {
  async calculateFinalScore(enrollmentId, studentId, courseOfferingId) {
    const assessments = await Assessment.find({ courseOfferingId });
    let finalScore = 0;

    for (const assessment of assessments) {
      const studentAss = await StudentAssessment.findOne({ assessmentId: assessment._id, studentId });
      if (studentAss) {
        // Assume score is out of maximumMarks and needs to be scaled to weight
        const score = studentAss.score || 0;
        const scaledScore = (score / assessment.maximumMarks) * assessment.weight;
        finalScore += scaledScore || 0;
      }
    }
    
    return Math.round(finalScore);
  }

  async saveDraft(enrollmentId, studentId, courseOfferingId) {
    let finalScore = await this.calculateFinalScore(enrollmentId, studentId, courseOfferingId);
    if (isNaN(finalScore)) finalScore = 0;
    const gradeInfo = await GradeService.convertScoreToGrade(finalScore);
    
    let result = await Result.findOne({ enrollmentId });
    if (!result) {
      result = new Result({ enrollmentId });
    }
    
    // Can only save draft if it's not already published or approved
    if (['Approved', 'Published'].includes(result.status)) {
      throw new Error('Cannot modify an approved or published result');
    }

    result.finalScore = finalScore;
    result.letterGrade = gradeInfo.letterGrade;
    result.gradePoint = gradeInfo.gradePoint;
    result.isPass = gradeInfo.isPass;
    result.status = 'Draft';
    
    await result.save();
    eventBus.emit('result.draft_saved', { resultId: result._id });
    return result;
  }

  async submitResult(resultId) {
    const result = await Result.findById(resultId);
    if (!result) throw new Error('Result not found');
    if (result.status !== 'Draft') throw new Error('Only draft results can be submitted');
    
    result.status = 'Submitted';
    await result.save();
    eventBus.emit('result.submitted', { resultId: result._id });
    return result;
  }

  async approveResult(resultId) {
    const result = await Result.findById(resultId);
    if (!result) throw new Error('Result not found');
    if (result.status !== 'Submitted') throw new Error('Only submitted results can be approved');
    
    result.status = 'Approved';
    await result.save();
    eventBus.emit('result.approved', { resultId: result._id });
    return result;
  }

  async publishResult(resultId) {
    const result = await Result.findById(resultId).populate('enrollmentId');
    if (!result) throw new Error('Result not found');
    if (result.status !== 'Approved') throw new Error('Only approved results can be published');
    
    result.status = 'Published';
    await result.save();
    
    eventBus.emit('result.published', { resultId: result._id, studentId: result.enrollmentId.studentId });
    return result;
  }
}

module.exports = new ResultService();
