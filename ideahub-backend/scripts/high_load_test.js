import http from 'http';

// Configure http agent with keepAlive to reuse TCP connections efficiently
const agent = new http.Agent({
  keepAlive: true,
  maxSockets: 200,
});

const URL = 'http://localhost:5000/api/health';
const TOTAL_REQUESTS = 10000; // 10,000 requests test batch
const CONCURRENCY = 100; // 100 parallel worker threads

let completed = 0;
let successCount = 0;
let failCount = 0;
const startTime = Date.now();

console.log(`🚀 Starting High-Scale Load Test: ${TOTAL_REQUESTS.toLocaleString()} requests with concurrency of ${CONCURRENCY}...`);

let active = 0;
let launched = 0;

let rateLimitedCount = 0;

function sendNext() {
  if (launched >= TOTAL_REQUESTS) return;
  launched++;
  active++;

  const req = http.get(URL, { agent }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      completed++;
      if (res.statusCode === 200) successCount++;
      else if (res.statusCode === 429) rateLimitedCount++;
      else failCount++;
      active--;
      printProgress();
      sendNext();
    });
  });

  req.on('error', (err) => {
    completed++;
    failCount++;
    active--;
    printProgress();
    sendNext();
  });
}

function printProgress() {
  if (completed % 2500 === 0 || completed === TOTAL_REQUESTS) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`  ⌛ Processed ${completed.toLocaleString()} / ${TOTAL_REQUESTS.toLocaleString()} requests (${elapsed}s elapsed)...`);
  }

  if (completed === TOTAL_REQUESTS) {
    const totalTimeMs = Date.now() - startTime;
    const totalTimeSec = totalTimeMs / 1000;
    console.log('\n======================================================');
    console.log('🏆 HIGH-SCALE LOAD TEST RESULTS (10,000 Requests)');
    console.log('======================================================');
    console.log(`Total Requests Processed: ${TOTAL_REQUESTS.toLocaleString()}`);
    console.log(`Successful Requests (200 OK): ${successCount.toLocaleString()}`);
    console.log(`Rate Limited Protection (429 Too Many Requests): ${rateLimitedCount.toLocaleString()}`);
    console.log(`Server Crashes / Connection Failures: ${failCount}`);
    console.log(`Total Time Taken: ${totalTimeSec.toFixed(2)} seconds`);
    console.log(`Average Latency: ${(totalTimeMs / TOTAL_REQUESTS).toFixed(2)} ms / request`);
    console.log(`Throughput Rate: ${(TOTAL_REQUESTS / totalTimeSec).toFixed(2)} requests / second`);
    console.log('======================================================\n');
    process.exit(0);
  }
}

// Initial pool launch
for (let i = 0; i < CONCURRENCY; i++) {
  sendNext();
}
