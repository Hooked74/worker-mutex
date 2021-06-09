export class WorkersExpecter {
  public static connect(workersExpecter: WorkersExpecter) {
    return new WorkersExpecter(0, workersExpecter.buffer);
  }

  constructor(initial: number, private buffer = new SharedArrayBuffer(4), private data = new Int32Array(buffer)) {
    this.add(initial);
  }

  public add(value: number) {
    const currentState = value + Atomics.add(this.data, 0, value);

    switch (true) {
      case currentState < 0:
        throw new Error("WorkersExpecter is in inconsistent state: negative count.");
      case currentState === 0:
        Atomics.notify(this.data, 0);
    }
  }

  public done() {
    this.add(-1);
  }

  public wait() {
    let count: number;
    do {
      count = Atomics.load(this.data, 0);
    } while (count !== 0 && Atomics.wait(this.data, 0, count) !== "ok");
  }
}
