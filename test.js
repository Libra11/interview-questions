console.log("1. 同步");

setTimeout(() => {
  console.log("2. setTimeout");
}, 0);

setImmediate(() => {
  console.log("3. setImmediate");
});

process.nextTick(() => {
  console.log("4. nextTick");
});

Promise.resolve().then(() => {
  console.log("5. Promise.then");
});

console.log("6. 同步");

// 执行顺序（Node.js）：
// 1. 同步
// 6. 同步
// 4. nextTick（优先级最高）
// 5. Promise.then（微任务）
// 2. setTimeout（timers 阶段）
// 3. setImmediate（check 阶段）
