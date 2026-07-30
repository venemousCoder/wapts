const cron = require('node-cron');
const Notification = require('../models/Notification');
const AuditService = require('./AuditService');

class SchedulerService {
  constructor() {
    this.jobs = [];
  }

  registerJob(name, schedule, taskFn) {
    const job = cron.schedule(schedule, async () => {
      try {
        if (process.env.NODE_ENV !== 'test') console.log(`Starting scheduled job: ${name}`);
        await taskFn();
        if (process.env.NODE_ENV !== 'test') console.log(`Successfully completed job: ${name}`);
      } catch (error) {
        console.error(`Failed to execute job ${name}:`, error);
        await AuditService.log('CRON_JOB_FAILED', name, null, null, null, { error: error.message });
      }
    });
    
    this.jobs.push({ name, job });
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Registered cron job: ${name} with schedule ${schedule}`);
    }
  }

  init() {
    // Run every night at midnight to archive expired notifications
    this.registerJob('ArchiveExpiredNotifications', '0 0 * * *', async () => {
      const result = await Notification.updateMany(
        { expiresAt: { $lt: new Date() }, isRead: true },
        { $set: { priority: 'Low' } } // For now just lower priority, real implementation might archive/delete
      );
      if (process.env.NODE_ENV !== 'test') {
        console.log(`Archived ${result.modifiedCount} expired notifications.`);
      }
    });
    
    // Add other jobs like session rollover here
  }
}

module.exports = new SchedulerService();
