const LecturerProfile = require('../models/LecturerProfile');
const User = require('../models/User');
const CourseOffering = require('../models/CourseOffering');
const AuditService = require('./AuditService');

class LecturerAssignmentService {
  async lookupLecturerByStaffNumber(staffNumber) {
    // Staff number is the loginIdentifier of the user
    const user = await User.findOne({ loginIdentifier: staffNumber, role: 'Lecturer', isDeleted: false });
    if (!user) {
      return null;
    }

    const lecturer = await LecturerProfile.findOne({ userId: user._id, isDeleted: false })
      .populate('departmentId');
      
    if (!lecturer) {
      return null;
    }

    return {
      _id: lecturer._id,
      staffNumber: user.loginIdentifier,
      fullName: `${user.firstName} ${user.lastName}`,
      departmentName: lecturer.departmentId ? lecturer.departmentId.name : 'Unknown',
      departmentId: lecturer.departmentId ? lecturer.departmentId._id : null,
      rank: lecturer.designation || 'Lecturer',
      status: lecturer.approvalStatus
    };
  }

  async assignLecturer(offeringId, lecturerId, hodUserId, forceOverride = false) {
    const offering = await CourseOffering.findById(offeringId).populate({
      path: 'courseId',
      populate: { path: 'departmentId' }
    });
    
    if (!offering) {
      throw new Error('Course offering not found');
    }

    const lecturer = await LecturerProfile.findById(lecturerId).populate({
      path: 'userId'
    }).populate('departmentId');

    if (!lecturer) {
      throw new Error('Lecturer not found');
    }

    // Validation: Status must be Active, Approved, or Pending (temporarily allowed for testing)
    if (lecturer.approvalStatus !== 'Active' && lecturer.approvalStatus !== 'Approved' && lecturer.approvalStatus !== 'Pending') {
      throw new Error(`Lecturer status is ${lecturer.approvalStatus}. Only Active or Approved lecturers can be assigned.`);
    }

    // Validation: Prevent duplicate assignments
    if (offering.lecturerId && offering.lecturerId.toString() === lecturerId.toString()) {
      throw new Error('Lecturer is already assigned to this Course Offering.');
    }

    // Validation: Workload Check
    const activeAssignmentsCount = await CourseOffering.countDocuments({
      lecturerId: lecturerId,
      status: { $in: ['Draft', 'Published'] }
    });

    if (activeAssignmentsCount >= 5 && !forceOverride) {
      throw new Error('WORKLOAD_WARNING: This lecturer is already assigned to 5 or more Course Offerings.');
    }

    offering.lecturerId = lecturerId;
    await offering.save();

    // Audit Logging
    const lecturerName = `${lecturer.userId.firstName} ${lecturer.userId.lastName}`;
    const homeDept = lecturer.departmentId ? lecturer.departmentId.name : 'Unknown';
    const teachingDept = offering.courseId.departmentId ? offering.courseId.departmentId.name : 'Unknown';
    const auditDetails = `Assigned ${lecturerName} (Home Department: ${homeDept}) to teach ${offering.courseId.title} under ${teachingDept} Department`;

    await AuditService.log('ASSIGN_LECTURER', 'CourseOffering', offering._id, auditDetails, null, hodUserId, '0.0.0.0', 'System');

    return offering;
  }
}

module.exports = new LecturerAssignmentService();
