const mongoose = require('mongoose');
const GradeScale = require('../models/GradeScale');
const StudentAssessment = require('../models/StudentAssessment');

mongoose.connect('mongodb://localhost:27017/wapts', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    try {
      await GradeScale.deleteMany({});
      await GradeScale.insertMany([
        { minimumScore: 70, maximumScore: 100, letterGrade: 'A', gradePoint: 5, isActive: true },
        { minimumScore: 60, maximumScore: 69.99, letterGrade: 'B', gradePoint: 4, isActive: true },
        { minimumScore: 50, maximumScore: 59.99, letterGrade: 'C', gradePoint: 3, isActive: true },
        { minimumScore: 45, maximumScore: 49.99, letterGrade: 'D', gradePoint: 2, isActive: true },
        { minimumScore: 40, maximumScore: 44.99, letterGrade: 'E', gradePoint: 1, isActive: true },
        { minimumScore: 0,  maximumScore: 39.99, letterGrade: 'F', gradePoint: 0, isActive: true }
      ]);
      console.log('Grade scales reset successfully');
      
      const stAss = await StudentAssessment.find({});
      console.log('Student Assessments Count:', stAss.length);
      if(stAss.length > 0) {
        console.log('Sample score:', stAss[0].score);
      }
    } catch (e) {
      console.error(e);
    } finally {
      process.exit(0);
    }
  });
