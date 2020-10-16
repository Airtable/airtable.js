import internalConfig from './internal_config.json';

// "Full Jitter" algorithm taken from https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
function exponentialBackoffWithJitter(numberOfRetries: number): number {
    const rawBackoffTimeMs =
        internalConfig.INITIAL_RETRY_DELAY_IF_RATE_LIMITED * 2 ** numberOfRetries;
    const clippedBackoffTimeMs = Math.min(
        internalConfig.MAX_RETRY_DELAY_IF_RATE_LIMITED,
        rawBackoffTimeMs
    );
    const jitteredBackoffTimeMs = Math.random() * clippedBackoffTimeMs;
    return jitteredBackoffTimeMs;
}

export = exponentialBackoffWithJitter;
