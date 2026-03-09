const fs = require('fs');

// Configuration
// Rate Limit is 10 r/s per IP. Since we run locally, all bots share 1 IP.
// Target RPS: 8 (Safety margin)
// Concurrency: 5 users parallel suitable for 8 RPS if delays are managed.
const BASE_URL = 'http://localhost:8888';
const CONCURRENCY = 5;
const TARGET_TOTAL_USERS = 50; // Smaller batch for realistic verification
const ACTIONS_PER_USER = 10;

// Endpoints
const ENDPOINTS = {
    auth: {
        register: `${BASE_URL}/api/user_service/auth/register`,
        login: `${BASE_URL}/api/user_service/auth/login`
    },
    publications: {
        base: `${BASE_URL}/api/publications_service/`,
        notices: `${BASE_URL}/api/publications_service/notices`
    },
    orders: {
        base: `${BASE_URL}/api/orders_service/`
    }
};

// Utils
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const randomString = () => Math.random().toString(36).substring(7);

// Stats
const stats = {
    registered: 0,
    logins: 0,
    publications: 0,
    notices: 0,
    orders: 0, // Reads
    reads: 0,
    errors: 0,
    totalRequests: 0,
    startTime: Date.now()
};

class UserBot {
    constructor(id) {
        this.id = id;
        this.email = `real_user_${Date.now()}_${id}_${randomString()}@global.com`;
        this.password = 'password123';
        this.name = `Global User ${id}`;
        this.token = null;
        this.apiHeaders = {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:8888'
        };
    }

    // Gentle Wrapper to respect Rate Limits
    async request(url, options) {
        // Global throttle: Ensure we don't exceed ~8 req/s total across all workers
        // Simple random delay is usually enough if concurrency is low
        await sleep(Math.random() * 1000 + 500);
        try {
            const res = await fetch(url, options);
            stats.totalRequests++;
            if (!res.ok) {
                if (res.status === 503) {
                    // Backoff on rate limit
                    await sleep(2000);
                }
                throw new Error(res.status);
            }
            return res;
        } catch (e) {
            stats.errors++;
            // console.error(`Error ${url}: ${e.message}`);
            return null;
        }
    }

    async register() {
        const res = await this.request(ENDPOINTS.auth.register, {
            method: 'POST',
            headers: this.apiHeaders,
            body: JSON.stringify({
                name_up: this.name,
                email_up: this.email,
                password_up: this.password
            })
        });
        if (res && res.ok) {
            stats.registered++;
            return true;
        }
        return false;
    }

    async login() {
        const res = await this.request(ENDPOINTS.auth.login, {
            method: 'POST',
            headers: this.apiHeaders,
            body: JSON.stringify({
                email: this.email,
                password: this.password
            })
        });

        if (res && res.ok) {
            const setCookie = res.headers.get('set-cookie');
            if (setCookie) {
                this.token = setCookie;
                this.apiHeaders['Cookie'] = this.token;
            } else {
                const data = await res.json();
                if (data.token) {
                    this.token = `Bearer ${data.token}`;
                    this.apiHeaders['Authorization'] = this.token;
                }
            }
            if (this.token) {
                stats.logins++;
                return true;
            }
        }
        return false;
    }

    async createPublication() {
        if (!this.token) return;
        const formData = new FormData();
        formData.append('name', `Mining Truck ${randomString()}`);
        formData.append('category', 'Maquinaria');
        formData.append('price', (Math.random() * 50000).toFixed(2));
        formData.append('description', "High quality mining equipment from Global User.");

        // Mock headers forFormData (fetch handles boundary)
        const headers = { ...this.apiHeaders };
        delete headers['Content-Type'];

        const res = await this.request(ENDPOINTS.publications.base, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        if (res && res.ok) stats.publications++;
    }

    async createNotice() {
        if (!this.token) return; // Notices might require auth check logic
        // Endpoint: /api/publications_service/notices (POST presumed based on conventions, user didn't show create logic but delete was there)
        // Wait, dashboard_notices.js uses GET /notices and DELETE /notices/:id.
        // It imports CreateNoticeModal. Logic for Creation likely in Modal or specific Service file.
        // Assuming POST /api/publications_service/notices based on typical REST.

        const formData = new FormData();
        formData.append('title', `Industry News ${randomString()}`);
        formData.append('subtitle', `Subtitle ${randomString()}`);
        formData.append('description', "Breaking news about mining sector.");

        const headers = { ...this.apiHeaders };
        delete headers['Content-Type'];

        const res = await this.request(ENDPOINTS.publications.notices, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        if (res && res.ok) stats.notices++;
    }

    async readContent() {
        // Browse products or notices
        const endpoint = Math.random() > 0.5 ? ENDPOINTS.publications.base : ENDPOINTS.publications.notices;
        const res = await this.request(endpoint, { headers: this.apiHeaders });
        if (res && res.ok) stats.reads++;
    }

    async createOrder() {
        // Just read orders for now as realistic ordering requires cart+product flow
        if (!this.token) return;
        const res = await this.request(ENDPOINTS.orders.base, { headers: this.apiHeaders });
        if (res && res.ok) stats.orders++;
    }

    async runLifeCycle() {
        if (await this.register()) {
            await sleep(500);
            if (await this.login()) {
                for (let i = 0; i < ACTIONS_PER_USER; i++) {
                    const r = Math.random();
                    if (r < 0.2) await this.createPublication();
                    else if (r < 0.3) await this.createNotice();
                    else if (r < 0.5) await this.createOrder();
                    else await this.readContent();

                    // Specific user think time
                    await sleep(Math.random() * 2000 + 1000);
                }
            }
        }
    }
}

async function main() {
    console.log(`Starting REALISTIC load test: ${TARGET_TOTAL_USERS} users, concurrency ${CONCURRENCY}`);
    console.log(`Targeting approx 8 RPS to avoid Rate Limit (10 RPS)`);

    let activeWorkers = 0;
    let usersLaunched = 0;

    const workerLoop = async () => {
        while (usersLaunched < TARGET_TOTAL_USERS) {
            usersLaunched++;
            const bot = new UserBot(usersLaunched);
            await bot.runLifeCycle();
        }
    };

    const workers = [];
    for (let i = 0; i < CONCURRENCY; i++) {
        workers.push(workerLoop());
        await sleep(1000); // Stagger start
    }

    // Monitor
    const interval = setInterval(() => {
        const elapsed = (Date.now() - stats.startTime) / 1000;
        const rps = (stats.totalRequests / elapsed).toFixed(1);
        process.stdout.write(`\r[${elapsed.toFixed(0)}s] Req: ${stats.totalRequests} | RPS: ${rps} | Reg: ${stats.registered} | Pubs: ${stats.publications} | Noti: ${stats.notices} | Err: ${stats.errors}   `);
    }, 1000);

    await Promise.all(workers);
    clearInterval(interval);

    console.log("\n\n--- REALISTIC TEST COMPLETE ---");
    console.log(`Total Requests: ${stats.totalRequests}`);
    console.log(`Duration: ${((Date.now() - stats.startTime) / 1000).toFixed(2)}s`);
    console.log(`Errors (Blocked/Failed): ${stats.errors}`);
}

main();
