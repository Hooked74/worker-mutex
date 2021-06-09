import "regenerator-runtime/runtime";
import { AdvancedWorker, createAdvancedWorker } from "./AdvancedWorker";
import { Mutex } from "./Mutex";
import { WorkerPool } from "./WorkerPool";
import { WorkersExpecter } from "./WorkersExpecter";

(function main() {
  const size = 30;

  const workerPool = new WorkerPool(() => createAdvancedWorker(new Worker("worker.ts")), size);
  const waiterWorkerPool = new WorkerPool(() => createAdvancedWorker(new Worker("waiter.worker.ts")), 1);
  const buffer = new SharedArrayBuffer(4);
  const mutex = new Mutex();
  const workersExpecter = new WorkersExpecter(size);

  waiterWorkerPool.run(() => ({ workersExpecter, buffer }));

  for (let i = 0; i < size; i++) {
    workerPool.run(() => ({ workersExpecter, mutex, buffer }));
  }
})();
