class LeakyBucket {
  private bucketSize: number;
  private refillRate: number;
  private capacity: number;
  private lastTimestamp: number;

  constructor(bucketSize: number, refillRate: number, capacity: number) {
    this.bucketSize = bucketSize;
    this.refillRate = refillRate; // seconds
    this.capacity = capacity;
    this.lastTimestamp = Date.now();
  }

  private refillBucket() {
    this.bucketSize = this.capacity;
  }

  private decrement() {
    this.bucketSize -= 1;
  }

  private hasTokens() {
    return this.bucketSize > 0;
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

export default LeakyBucket;
