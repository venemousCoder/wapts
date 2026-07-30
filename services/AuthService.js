const User = require('../models/User');
const bcrypt = require('bcryptjs');

class AuthService {
  async authenticate(identifier, password) {
    const user = await User.findOne({ 
      $or: [
        { loginIdentifier: identifier },
        { email: identifier }
      ],
      isDeleted: false 
    });
    if (!user) {
      return null;
    }
    
    if (user.accountStatus !== 'Active') {
      throw new Error(`Account is ${user.accountStatus.toLowerCase()}`);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return null;
    }

    user.lastLogin = new Date();
    await user.save();

    return user;
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) throw new Error('Incorrect current password');

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    return true;
  }
}

module.exports = new AuthService();
