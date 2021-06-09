import { Mutex } from "./Mutex";
import { WorkersExpecter } from "./WorkersExpecter";

self.addEventListener(
  "message",
  (
    e: MessageEvent<{
      uuid: string;
      workersExpecter: WorkersExpecter;
      mutex: Mutex;
      buffer: SharedArrayBuffer;
    }>
  ) => {
    console.log(`worker ${e.data.uuid} started`);

    const workersExpecter = WorkersExpecter.connect(e.data.workersExpecter);
    const mutex = Mutex.connect(e.data.mutex);
    const count = new Int32Array(e.data.buffer);

    // Do some stuff.
    const random = (Math.random() * Math.floor(10)) | 0;

    mutex.lock();
    console.log("start of critical section");
    // This section does not require atomic operations, the mutex takes care of it.
    // This allows to do complex operations with the guarantee that no other worker
    // is in it. For example we could modify multiple sections of the array without
    // worrying that some might have changed before we are done.

    // This is a very simple example.
    count[0] = count[0] + random;
    // Load count[0] again, which won't have changed.
    console.log(`worker: ${random} ${count[0]}`);
    console.log("end of critical section");
    mutex.unlock();

    // Simulate intensive computation.
    for (let i = 0; i < 100000; i++);

    // Signal termination.
    console.log(`worker ${e.data.uuid} done`);
    workersExpecter.done();
  },
  false
);
