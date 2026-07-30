const mongoose = require('mongoose');
const GradeScale = require('../models/GradeScale');
const StudentAssessment = require('../models/StudentAssessment');
const Result = require('../models/Result');
const Assessment = require('../models/Assessment');

mongoose.connect('mongodb://localhost:27017/wapts', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    try {
      const scales = await GradeScale.find({});
      console.log('GradeScales:', scales);
      
      const assessments = await Assessment.find({});
      console.log('Assessments:', assessments);

      const stAss = await StudentAssessment.find({});
      console.log('StudentAssessments:', stAss);

      const results = await Result.find({});
      console.log('Results:', results);
      
    } catch (e) {
      console.error(e);
    } finally {
      process.exit(0);
    }
  });
