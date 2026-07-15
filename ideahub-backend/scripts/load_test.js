import http from 'http';

const URL = 'http://localhost:5000/api/health';
const TOTAL_REQUESTS = 500; // Simulate 500 concurrent requests
let completed = 0;
let successCount = 0;
let failCount = 0;
const startTime = Date.now();

console.log(`🚀 Launching concurrency benchmark test: ${TOTAL_REQUESTS} requests to ${URL}...`);

for (let i = 0; i < TOTAL_REQUESTS; i++) {
  http.get(URL, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      completed++;
      if (res.statusCode === 200) {
        successCount++;
      } else {
        failCount++;
      }
      checkDone();
    });
  }).on('error', (err) => {
    completed++;
    failCount++;
    checkDone();
  });
}

function checkDone() {
  if (completed === TOTAL_REQUESTS) {
    const duration = Date.now() - startTime;
    console.log('\n--- Benchmark Test Results ---');
    console.log(`Total Requests: ${TOTAL_REQUESTS}`);
    console.log(`Success (200 OK): ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Total Time Taken: ${duration} ms`);
    console.log(`Average Latency: ${(duration / TOTAL_REQUESTS).toFixed(2)} ms / request`);
    console.log(`Throughput: ${((TOTAL_REQUESTS / duration) * 1000).toFixed(2)} req/sec`);
    process.exit(0);
  }
}
