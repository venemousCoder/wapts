/**
 * Unit Tests: EventBus
 * TC-EVENT-001 through TC-EVENT-003
 */
const eventBus = require('../../../utils/eventBus');

describe('EventBus', () => {
  afterEach(() => {
    eventBus.removeAllListeners('test.event');
    eventBus.removeAllListeners('test.*');
  });

  test('TC-EVENT-001: should be an EventEmitter2 instance', () => {
    expect(eventBus).toBeDefined();
    expect(typeof eventBus.on).toBe('function');
    expect(typeof eventBus.emit).toBe('function');
  });

  test('TC-EVENT-002: emit and on should work correctly', (done) => {
    eventBus.on('test.event', (data) => {
      expect(data.value).toBe(42);
      done();
    });
    eventBus.emit('test.event', { value: 42 });
  });

  test('TC-EVENT-003: should support wildcard events', (done) => {
    eventBus.on('test.*', (data) => {
      expect(data.value).toBe('wildcard');
      done();
    });
    eventBus.emit('test.anything', { value: 'wildcard' });
  });
});
