// Advance at most one source frame per paint, even after a main-thread stall.
export class FramePlayhead {
  constructor(frames, position = 0) {
    this.end = Math.max(0, frames - 1);
    this.position = this.clamp(position);
  }
  clamp(position) { return Math.max(0, Math.min(this.end, position)); }
  next(destination, elapsed = 16.667) {
    const target = this.clamp(destination), distance = target - this.position;
    if (Math.abs(distance) < 0.002) return target;
    const eased = Math.abs(distance) * (1 - Math.exp(-Math.min(32, elapsed) / 90));
    return this.clamp(this.position + Math.sign(distance) * Math.min(1, eased));
  }
  commit(position) { this.position = this.clamp(position); }
}
