import { WorkerStatuses } from "./WorkerStatuses";

export class Mutex {
  public static connect(mutex: Mutex) {
    return new Mutex(mutex.buffer);
  }

  constructor(private buffer = new SharedArrayBuffer(4), private data = new Int32Array(buffer)) {}

  public lock() {
    while (
      Atomics.compareExchange(this.data, 0, WorkerStatuses.unlocked, WorkerStatuses.locked) !== WorkerStatuses.unlocked
    ) {
      Atomics.wait(this.data, 0, WorkerStatuses.locked);
    }
  }

  public unlock() {
    if (
      Atomics.compareExchange(this.data, 0, WorkerStatuses.locked, WorkerStatuses.unlocked) != WorkerStatuses.locked
    ) {
      throw new Error("Mutex is in inconsistent state: unlock on unlocked Mutex.");
    }

    Atomics.notify(this.data, 0, 1);
  }
}
