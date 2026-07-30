const AcademicGoal = require('../models/AcademicGoal');
const DashboardSnapshot = require('../models/DashboardSnapshot');
const ClassificationService = require('./ClassificationService');

class GoalTrackingService {
  /**
   * Fetches the latest snapshot for the student, updates their AcademicGoal if it exists,
   * and returns the goal along with feasibility metrics.
   */
  async updateStudentGoal(studentUserId) {
    const StudentProfile = require('../models/StudentProfile');
    const student = await StudentProfile.findOne({ userId: studentUserId });
    if (!student) return null;

    const goal = await AcademicGoal.findOne({ studentId: student._id });
    if (!goal) return null;

    // Get current progress from DashboardSnapshot or StudentProfile
    // ProgressService assumes 120 total credits. We'll use 120 as standard.
    const TOTAL_CREDITS_REQUIRED = 120;
    const creditsCompleted = student.totalCreditsAttempted || 0; 
    // Using attempted so we account for failed courses in the CGPA logic.
    // Actually, progressService uses attemptedCredits for CGPA calculation.
    
    const currentCGPA = student.currentCGPA || 0;
    const creditsRemaining = Math.max(0, TOTAL_CREDITS_REQUIRED - creditsCompleted);

    goal.currentCGPA = currentCGPA;
    goal.creditsCompleted = creditsCompleted;
    goal.creditsRemaining = creditsRemaining;
    await goal.save();

    return this.getGoalDetails(goal);
  }

  async getGoalDetails(goal) {
    const feasibility = this.evaluateFeasibility(
      goal.currentCGPA,
      goal.targetCGPA,
      goal.creditsCompleted,
      goal.creditsRemaining
    );

    const insights = this.generateInsights(feasibility, goal.targetCGPA);
    const currentClassification = await ClassificationService.determineClassification(goal.currentCGPA);
    
    // Projected Classification assumes they hit the target exactly, OR if not achievable, the max possible.
    const projectedCGPA = feasibility.status === 'Not Achievable' ? feasibility.maxPossibleCGPA : goal.targetCGPA;
    const projectedClassification = await ClassificationService.determineClassification(projectedCGPA);

    return {
      goal,
      feasibility,
      insights,
      currentClassification,
      projectedClassification
    };
  }

  evaluateFeasibility(currentCGPA, targetCGPA, creditsCompleted, creditsRemaining) {
    if (creditsRemaining <= 0) {
      const isAchieved = currentCGPA >= targetCGPA;
      return {
        status: isAchieved ? 'Achieved' : 'Not Achievable',
        requiredGPA: 0,
        maxPossibleCGPA: currentCGPA,
        projectedCGPA: currentCGPA
      };
    }

    const totalCredits = creditsCompleted + creditsRemaining;
    const currentTotalPoints = currentCGPA * creditsCompleted;
    const targetTotalPoints = targetCGPA * totalCredits;
    
    const requiredRemainingPoints = targetTotalPoints - currentTotalPoints;
    let requiredGPA = requiredRemainingPoints / creditsRemaining;
    
    // Calculate max possible CGPA if student scores 5.0 in all remaining courses
    const maxPossiblePoints = currentTotalPoints + (5.0 * creditsRemaining);
    const maxPossibleCGPA = maxPossiblePoints / totalCredits;

    // Calculate projected CGPA if student maintains current CGPA
    const projectedTotalPoints = currentTotalPoints + (currentCGPA * creditsRemaining);
    const projectedCGPA = projectedTotalPoints / totalCredits;

    let status = 'On Track';
    
    if (requiredGPA > 5.0) {
      status = 'Not Achievable';
    } else if (requiredGPA > 4.5 || requiredGPA > currentCGPA + 1.0) {
      status = 'At Risk';
    } else if (requiredGPA <= currentCGPA) {
      status = 'On Track';
    }

    return {
      status,
      requiredGPA: parseFloat(requiredGPA.toFixed(2)),
      maxPossibleCGPA: parseFloat(maxPossibleCGPA.toFixed(2)),
      projectedCGPA: parseFloat(projectedCGPA.toFixed(2))
    };
  }

  generateInsights(feasibility, targetCGPA) {
    if (feasibility.status === 'Achieved') {
      return "Congratulations! You have already achieved or exceeded your target CGPA.";
    }
    if (feasibility.status === 'Not Achievable') {
      return `Even with perfect grades (5.0 GPA) in all remaining courses, your maximum possible CGPA is ${feasibility.maxPossibleCGPA}. This target cannot be achieved.`;
    }
    if (feasibility.status === 'At Risk') {
      return `Your recent performance needs a significant boost. You must average a GPA of ${feasibility.requiredGPA} to reach your goal of ${targetCGPA}.`;
    }
    if (feasibility.requiredGPA <= feasibility.projectedCGPA) {
      return `Maintaining your current performance will result in an estimated CGPA of ${feasibility.projectedCGPA}, safely above your target.`;
    }
    return `You are on track, but you need to increase your average GPA to ${feasibility.requiredGPA} over your remaining courses.`;
  }
}

module.exports = new GoalTrackingService();
