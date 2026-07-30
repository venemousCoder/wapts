/**
 * Unit Tests: SchedulerService
 * TC-SCHED-001 through TC-SCHED-003
 */

// Must mock node-cron before requiring SchedulerService
jest.mock('node-cron', () => ({
  schedule: jest.fn((schedule, fn) => ({ stop: jest.fn(), start: jest.fn(), scheduleFn: fn }))
}));

const cron = require('node-cron');

// We need a fresh instance, not the singleton, so we clear the module cache
let SchedulerService;

describe('SchedulerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the cached singleton so we get a fresh instance each test
    delete require.cache[require.resolve('../../../services/SchedulerService')];
    SchedulerService = require('../../../services/SchedulerService');
  });

  describe('registerJob', () => {
    test('TC-SCHED-001: should add job to internal list', () => {
      SchedulerService.registerJob('TestJob', '0 0 * * *', async () => {});
      expect(SchedulerService.jobs.length).toBe(1);
      expect(SchedulerService.jobs[0].name).toBe('TestJob');
      expect(cron.schedule).toHaveBeenCalledWith('0 0 * * *', expect.any(Function));
    });

    test('TC-SCHED-002: should register multiple jobs', () => {
      SchedulerService.registerJob('Job1', '0 0 * * *', async () => {});
      SchedulerService.registerJob('Job2', '0 6 * * *', async () => {});
      expect(SchedulerService.jobs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('init', () => {
    test('TC-SCHED-003: should register archive notifications job', () => {
      SchedulerService.init();
      expect(cron.schedule).toHaveBeenCalled();
      const jobNames = SchedulerService.jobs.map(j => j.name);
      expect(jobNames).toContain('ArchiveExpiredNotifications');
    });
  });
});
