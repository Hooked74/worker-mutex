import { WorkersExpecter } from "./WorkersExpecter";

self.addEventListener(
  "message",
  (
    e: MessageEvent<{
      workersExpecter: WorkersExpecter;
      buffer: SharedArrayBuffer;
    }>
  ) => {
    console.log("waiter started");

    const workersExpecter = WorkersExpecter.connect(e.data.workersExpecter);
    const count = new Int32Array(e.data.buffer);

    // Wait for workers to terminate.
    workersExpecter.wait();

    // The following lines will always execute last.
    console.log("final value:", count);
    console.log("waiter done");
  },
  false
);
