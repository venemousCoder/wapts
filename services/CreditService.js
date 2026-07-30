class CreditService {
  calculateCreditsEarned(results) {
    let earned = 0;
    for (const result of results) {
      if (result.isPass) {
        const creditUnits = result.enrollmentId?.courseOfferingId?.courseId?.creditUnits || 0;
        earned += creditUnits;
      }
    }
    return earned;
  }

  calculateCreditsAttempted(results) {
    let attempted = 0;
    for (const result of results) {
      const creditUnits = result.enrollmentId?.courseOfferingId?.courseId?.creditUnits || 0;
      attempted += creditUnits;
    }
    return attempted;
  }

  calculateGraduationProgress(earnedCredits, totalRequiredCredits) {
    if (totalRequiredCredits === 0) return 0;
    return parseFloat(((earnedCredits / totalRequiredCredits) * 100).toFixed(2));
  }
}

module.exports = new CreditService();
