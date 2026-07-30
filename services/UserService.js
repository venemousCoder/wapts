const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const LecturerProfile = require('../models/LecturerProfile');
const HodProfile = require('../models/HodProfile');
const bcrypt = require('bcryptjs');

class UserService {
  async createUser(userData, profileData, role) {
    // Note: Transaction management will be handled by the controller/orchestrator
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password || 'password123', salt);

    const newUser = new User({
      ...userData,
      passwordHash,
      role
    });

    await newUser.save();

    if (role === 'Student') {
      const profile = new StudentProfile({ ...profileData, userId: newUser._id });
      await profile.save();
    } else if (role === 'Lecturer') {
      const profile = new LecturerProfile({ ...profileData, userId: newUser._id });
      await profile.save();
    } else if (role === 'HOD') {
      const profile = new HodProfile({ ...profileData, userId: newUser._id });
      await profile.save();
    }

    return newUser;
  }

  async softDeleteUser(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();
    
    // Also soft delete corresponding profile
    if (user.role === 'Student') await StudentProfile.updateOne({ userId }, { isDeleted: true, deletedAt: new Date() });
    else if (user.role === 'Lecturer') await LecturerProfile.updateOne({ userId }, { isDeleted: true, deletedAt: new Date() });
    else if (user.role === 'HOD') await HodProfile.updateOne({ userId }, { isDeleted: true, deletedAt: new Date() });

    return user;
  }

  async getUserProfile(userId, role) {
    let profile = null;
    if (role === 'Student') profile = await StudentProfile.findOne({ userId, isDeleted: false }).populate('departmentId');
    else if (role === 'Lecturer') profile = await LecturerProfile.findOne({ userId, isDeleted: false }).populate('departmentId');
    else if (role === 'HOD') profile = await HodProfile.findOne({ userId, isDeleted: false }).populate('departmentId');

    return profile;
  }
}

module.exports = new UserService();
