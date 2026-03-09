const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:8888';
const CONCURRENCY = 200; // Aggressive concurrency
const TARGET_TOTAL_USERS = 10000; // Aggressive but bounded for local test
const ACTIONS_PER_USER = 1; // Just try to get in (Register/Login)

// Endpoints
const ENDPOINTS = {
    register: `${BASE_URL}/api/user_service/auth/register`
};

// Utils
const randomString = () => Math.random().toString(36).substring(7);

// Stats
const stats = {
    attempts: 0,
    success: 0,
    blocked: 0, // 503
    otherErrors: 0,
    startTime: Date.now(),
    latencies: [] // Store latencies for calc
};

async function userFlow(id) {
    const email = `extreme_${id}_${randomString()}@mm.com`;
    const password = 'password123';

    const start = Date.now();
    try {
        const res = await fetch(ENDPOINTS.register, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name_up: `User ${id}`, email_up: email, password_up: password })
        });
        const latency = Date.now() - start;
        stats.latencies.push(latency);

        if (res.ok) {
            stats.success++;
        } else if (res.status === 503) {
            stats.blocked++;
        } else {
            stats.otherErrors++;
        }
    } catch (e) {
        // Network timeout / connection refused if server dies
        stats.otherErrors++;
    }
    stats.attempts++;
}

async function main() {
    console.log(`Starting EXTREME stress test: ${TARGET_TOTAL_USERS} users, concurrency ${CONCURRENCY}`);
    console.log(`Expecting heavy 503 blocking.`);

    let usersLaunched = 0;

    const workerLoop = async () => {
        while (usersLaunched < TARGET_TOTAL_USERS) {
            usersLaunched++;
            await userFlow(usersLaunched);

            // Log every 5000 requests to avoid spamming stdout
            if (usersLaunched % 5000 === 0) {
                // Optimization: Don't log too often
            }
        }
    };

    const workers = [];
    for (let i = 0; i < CONCURRENCY; i++) {
        workers.push(workerLoop());
    }

    // Monitor
    const interval = setInterval(() => {
        const elapsed = (Date.now() - stats.startTime) / 1000;
        const rps = (stats.attempts / elapsed).toFixed(1);

        // Calc Latency
        const currentLatencies = stats.latencies; // Snapshot roughly
        const avgLat = currentLatencies.length > 0
            ? (currentLatencies.reduce((a, b) => a + b, 0) / currentLatencies.length).toFixed(0)
            : 0;
        const maxLat = currentLatencies.length > 0 ? Math.max(...currentLatencies) : 0;

        process.stdout.write(`\r[${elapsed.toFixed(0)}s] Attempts: ${stats.attempts}/${TARGET_TOTAL_USERS} | RPS: ${rps} | Latency: Avg ${avgLat}ms Max ${maxLat}ms | Blocked: ${stats.blocked} | Err: ${stats.otherErrors}   `);
    }, 1000);

    await Promise.all(workers);
    clearInterval(interval);

    console.log("\n\n--- EXTREME TEST COMPLETE ---");
    console.log(`Total Attempts: ${stats.attempts}`);
    console.log(`Duration: ${((Date.now() - stats.startTime) / 1000).toFixed(2)}s`);
    console.log(`Blocked: ${stats.blocked}`);
    console.log(`Success: ${stats.success}`);
}

main();
