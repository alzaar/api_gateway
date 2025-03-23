import { Request } from "express";

type BucketConfig = {
  refillRate: number;
  capacity: number;
};
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
    const userId: string | undefined = request["userId"];

    if (userId) {
      const userBucket = this.buckets.get(userId);
      if (userBucket) {
        userBucket.allow();
      }
    }
  }
}

export default RateLimiter;
