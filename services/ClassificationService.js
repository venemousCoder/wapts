const Classification = require('../models/Classification');
const SystemSetting = require('../models/SystemSetting');

class ClassificationService {
  async getActiveClassifications() {
    const classifications = await Classification.find({ isActive: true }).sort({ minimumCGPA: -1 });
    return classifications;
  }

  async determineClassification(cgpa) {
    const classifications = await this.getActiveClassifications();
    
    for (const cls of classifications) {
      if (cgpa >= cls.minimumCGPA && cgpa <= cls.maximumCGPA) {
        return cls.name;
      }
    }
    
    return 'Unclassified';
  }

  async getRemainingCGPAForNextClassification(cgpa) {
    const classifications = await this.getActiveClassifications();
    
    // Classifications are sorted descending by minimumCGPA
    // Find the first classification where minimumCGPA is greater than current cgpa
    for (let i = classifications.length - 1; i >= 0; i--) {
      const cls = classifications[i];
      if (cls.minimumCGPA > cgpa) {
        return parseFloat((cls.minimumCGPA - cgpa).toFixed(2));
      }
    }
    
    return 0; // Already at the highest classification
  }
}

module.exports = new ClassificationService();
