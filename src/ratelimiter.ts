import { Request } from "express";

type BucketConfig = {
  refillRate: number;
  capacity: number;
};

type JSONErrorType = {
  message: string;
  status: number;
  details?: object;
};
class JsonError extends Error {
  status: number;
  details?: object;

  constructor({ message, status, details }: JSONErrorType) {
    super(message);
    this.name = message;
    this.status = status;
    this.details = details;
  }
}
class LeakyBucket {
  private tokens: number;
  private refillRate: number;
  private capacity: number;
  private lastTimestamp: number;

  constructor({ refillRate, capacity }: BucketConfig) {
    this.tokens = capacity;
    this.refillRate = refillRate; // seconds
    this.capacity = capacity;
    this.lastTimestamp = Date.now();
  }

  private refillBucket() {
    this.tokens = this.capacity;
  }

  private decrement() {
    this.tokens -= 1;
  }

  private hasTokens() {
    return this.tokens > 0;
  }

  private canRefillBucket() {
    const timeNow = Date.now();
    const timeDelta = (timeNow - this.lastTimestamp) / 1000;

    if (timeDelta >= this.refillRate) {
      return true;
    }
    return false;
  }

  public allow() {
    if (this.canRefillBucket()) {
      this.refillBucket();
      this.decrement();
      this.lastTimestamp = Date.now();
      return true;
    }

    if (this.hasTokens()) {
      this.decrement();
      return true;
    }

    return false;
  }
}

class RateLimiter {
  private buckets: Map<string, LeakyBucket>;
  constructor() {
    this.buckets = new Map();
  }

  public allow(request: any) {
    const userId: string | undefined = request.user.id?.toString();

    if (userId) {
      let userBucket = this.buckets.get(userId);

      if (!userBucket) {
        this.buckets.set(
          userId,
          new LeakyBucket({ refillRate: 60_000, capacity: 5 })
        );
        userBucket = this.buckets.get(userId);
      }

      if (userBucket) {
        const permitUser = userBucket.allow();
        if (!permitUser) {
          throw new JsonError({
            message: "Too many requests",
            details: {
              error:
                "User not allowed to make request, API limit has been reached",
            },
            status: 429,
          });
        }
        return;
      }

      throw new JsonError({
        message: "Invalid user info",
        details: {
          error: "Internal server error, unable to retrieve user information",
        },
        status: 500,
      });
    }

    throw new JsonError({
      message: "Unable to retrieve user information from request",
      status: 400,
    });
  }
}

export default RateLimiter;
