export function isFulfilled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
    return result.status === 'fulfilled'
}

export function isNonNull<T>(value: T | null): value is T {
    return value !== null
}
