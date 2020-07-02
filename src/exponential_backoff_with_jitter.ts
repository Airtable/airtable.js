var internalConfig = require('./internal_config.json');

// "Full Jitter" algorithm taken from https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
function exponentialBackoffWithJitter(numberOfRetries) {
    var rawBackoffTimeMs =
        internalConfig.INITIAL_RETRY_DELAY_IF_RATE_LIMITED * Math.pow(2, numberOfRetries);
    var clippedBackoffTimeMs = Math.min(
        internalConfig.MAX_RETRY_DELAY_IF_RATE_LIMITED,
        rawBackoffTimeMs
    );
    var jitteredBackoffTimeMs = Math.random() * clippedBackoffTimeMs;
    return jitteredBackoffTimeMs;
}

module.exports = exponentialBackoffWithJitter;
