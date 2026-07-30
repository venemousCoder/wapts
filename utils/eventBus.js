const { EventEmitter2 } = require('eventemitter2');

const eventBus = new EventEmitter2({
  wildcard: true,
  delimiter: '.',
  maxListeners: 20,
  verboseMemoryLeak: true
});

module.exports = eventBus;
