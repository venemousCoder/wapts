const GradeScale = require('../models/GradeScale');
const SystemSetting = require('../models/SystemSetting');

class GradeService {
  async getActiveGradeScales() {
    // Ideally retrieve the active scale from system settings
    const settings = await SystemSetting.findOne();
    let query = { isActive: true };
    
    // If settings has a specific active scale ID (could be an array if multiple allowed, but schema says single)
    // Wait, the schema says SystemSetting has activeGradeScale which is a single ObjectId, meaning it points to a default scale?
    // Actually, GradeScale records usually represent individual grades (e.g. A, B, C).
    // Let's assume GradeScale collection holds all active grade definitions for the institution.
    
    const scales = await GradeScale.find(query).sort({ minimumScore: -1 });
    return scales;
  }

  async convertScoreToGrade(score) {
    const dbScales = await this.getActiveGradeScales();
    
    // Default NUC standard grade scales
    const fallbackScales = [
      { minimumScore: 70, maximumScore: 100, letterGrade: 'A', gradePoint: 5 },
      { minimumScore: 60, maximumScore: 69.99, letterGrade: 'B', gradePoint: 4 },
      { minimumScore: 50, maximumScore: 59.99, letterGrade: 'C', gradePoint: 3 },
      { minimumScore: 45, maximumScore: 49.99, letterGrade: 'D', gradePoint: 2 },
      { minimumScore: 40, maximumScore: 44.99, letterGrade: 'E', gradePoint: 1 },
      { minimumScore: 0,  maximumScore: 39.99, letterGrade: 'F', gradePoint: 0 }
    ];

    // Try to match with DB scales first, if any, but only if it looks like a complete scale (e.g., >= 5 grades)
    if (dbScales && dbScales.length >= 5) {
      for (const scale of dbScales) {
        if (score >= scale.minimumScore && score <= scale.maximumScore) {
          return {
            letterGrade: scale.letterGrade,
            gradePoint: scale.gradePoint,
            isPass: scale.gradePoint > 0
          };
        }
      }
    }
    
    // If no DB scales matched (e.g. they are misconfigured or empty), use fallback
    for (const scale of fallbackScales) {
      if (score >= scale.minimumScore && score <= scale.maximumScore) {
        return {
          letterGrade: scale.letterGrade,
          gradePoint: scale.gradePoint,
          isPass: scale.gradePoint > 0
        };
      }
    }
    
    // Final fallback if even the score is out of bounds (e.g. < 0 or > 100)
    return {
      letterGrade: 'F',
      gradePoint: 0,
      isPass: false
    };
  }

  async calculateSemesterGPA(results) {
    let totalGradePoints = 0;
    let totalCreditUnits = 0;

    for (const result of results) {
      // result.enrollmentId.courseOfferingId.courseId.creditUnits must be populated
      const creditUnits = result.enrollmentId?.courseOfferingId?.courseId?.creditUnits || 0;
      totalGradePoints += (result.gradePoint * creditUnits);
      totalCreditUnits += creditUnits;
    }

    if (totalCreditUnits === 0) return 0;
    
    return parseFloat((totalGradePoints / totalCreditUnits).toFixed(2));
  }
}

module.exports = new GradeService();
