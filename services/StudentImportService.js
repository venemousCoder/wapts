const fs = require('fs');
const csv = require('csv-parser');
const UserService = require('./UserService');
const User = require('../models/User');
const crypto = require('crypto');

class StudentImportService {
  async importFromCSV(filePath, departmentId, adminUserId, assignedLevels = null) {
    const results = [];
    const errors = [];
    let processed = 0;
    let successful = 0;

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          try {
            for (const row of results) {
              processed++;
              
              // Map CSV fields based on expected standard
              const firstName = row.firstName || row['First Name'];
              const lastName = row.lastName || row['Last Name'];
              const loginIdentifier = row.loginIdentifier || row.regNumber || row['Registration Number'];
              const email = row.email || row['Email Address'];
              const programme = row.programme || row['Programme'];
              const level = row.level || row['Level'];
              const admissionYear = row.admissionYear || row['Admission Session'];

              if (!firstName || !lastName || !loginIdentifier || !level) {
                errors.push(`Row ${processed}: Missing required fields (firstName, lastName, Registration Number, Level)`);
                continue;
              }

              if (assignedLevels && assignedLevels.length > 0) {
                if (!assignedLevels.includes(parseInt(level))) {
                  errors.push(`Row ${processed}: Unauthorized level ${level}. You can only import students for levels: ${assignedLevels.join(', ')}`);
                  continue;
                }
              }

              // Check for duplicate reg number
              const existingUser = await User.findOne({ loginIdentifier: loginIdentifier });
              if (existingUser) {
                errors.push(`Row ${processed}: Duplicate Registration Number '${loginIdentifier}'`);
                continue;
              }

              // Generate temporary password (deterministic so HOD can easily communicate it)
              const tempPassword = lastName.toLowerCase().replace(/[^a-z]/g, '') + '123';
              
              try {
                // Ensure password change on first login
                const user = await UserService.createUser(
                  { 
                    loginIdentifier, 
                    loginType: 'REG_NUMBER', 
                    password: tempPassword,
                    firstName,
                    lastName
                  },
                  {
                    departmentId: departmentId,
                    level: parseInt(level),
                    programme: programme,
                    admissionYear: admissionYear
                  },
                  'Student'
                );

                // Set requiresPasswordChange flag
                user.requiresPasswordChange = true;
                await user.save();

                // Generate audit log (controller level handles it usually, but we can do it here for bulk)
                const AuditService = require('./AuditService');
                await AuditService.log('CREATE_STUDENT_BULK', 'User', user._id, user, null, adminUserId, '127.0.0.1', 'CSV Import');

                successful++;
              } catch (err) {
                errors.push(`Row ${processed}: ${err.message}`);
              }
            }
            
            // Clean up the uploaded file
            fs.unlinkSync(filePath);
            
            resolve({
              total: processed,
              successful,
              failed: errors.length,
              errors
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
}

module.exports = new StudentImportService();
