// Scroll position is the film position. No frame queue or trailing inertia.
export class FramePlayhead {
  constructor(frames, position = 0) {
    this.end = Math.max(0, frames - 1);
    this.position = this.clamp(position);
  }
  clamp(position) { return Math.max(0, Math.min(this.end, position)); }
  next(destination) { return this.clamp(destination); }
  commit(position) { this.position = this.clamp(position); }
}
