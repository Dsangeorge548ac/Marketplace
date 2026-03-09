const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:8888';
const CONCURRENCY = 20; // Moderate concurrency
const TARGET_TOTAL_USERS = 500; // Moderate duration
const ACTIONS_PER_USER = 20; // Increased actions per user

// Endpoints
const ENDPOINTS = {
    auth: {
        register: `${BASE_URL}/api/user_service/auth/register`,
        login: `${BASE_URL}/api/user_service/auth/login`
    },
    publications: {
        base: `${BASE_URL}/api/publications_service/`
    },
    orders: {
        base: `${BASE_URL}/api/orders_service/`
    },
    users: {
        base: `${BASE_URL}/api/user_service/`
    }
};

// Utils
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const randomString = () => Math.random().toString(36).substring(7);

// One pixel image for creation
const ONE_PIXEL_JPG = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

// Stats
const stats = {
    registered: 0,
    logins: 0,
    publicationsCreated: 0,
    orderschreated: 0,
    reads: 0,
    imagesFetched: 0,
    errors: 0,
    rateLimited: 0, // 429 Errors
    totalRequests: 0,
    startTime: Date.now()
};

// Global list of existing image URLs to stress test
let EXISTING_IMAGE_URLS = [];

async function collectImageUrls() {
    console.log("Fetching existing publications to extract image URLs...");
    try {
        const res = await fetch(`${ENDPOINTS.publications.base}?limit=100`);
        if (res.ok) {
            const json = await res.json();
            const pubs = json.data || [];

            pubs.forEach(p => {
                if (p.image && p.image.startsWith('/publications_service/uploads/')) {
                    // Convert relative service path to Gateway URL
                    // Service format: /publications_service/uploads/filename.jpg
                    // Gateway mounts /api/publications_service -> publications_service
                    // So URL: http://localhost:8888/api/publications_service/uploads/filename.jpg is wrong?
                    // Wait, service returns `/publications_service/uploads/...`?
                    // Let's check publication.controller.js line 162:
                    // const image = req.file ? `/publications_service/uploads/${req.file.filename}` : '';
                    // So the DB has that string.
                    // If I request http://localhost:8888/api/publications_service/uploads/file, 
                    // Gateway forwards to publications_service /uploads/file ?? or /publications_service/uploads/file?
                    // Usually Gateway strips prefix /api/publications_service.
                    // If service serves `app.use('/uploads', ...)` then it expects `/uploads/...`
                    // So if DB path is `/publications_service/uploads/...`, the frontend usually strips it or Gateway handles it.
                    // BUT, let's assume valid URL is BASE_URL + '/api' + (path from DB if it starts with /)
                    // Actually, if DB has `/publications_service/uploads/foo.jpg`, and Gateway forwards `/api/publications_service` -> Service Root.
                    // Service Root sees `GET /uploads/foo.jpg`.
                    // So we need to construct: BASE_URL + '/api' + '/publications_service/uploads/foo.jpg'?
                    // No. BASE_URL + '/api/publications_service' + '/uploads/foo.jpg' -> /api/publications_service/uploads/foo.jpg
                    // If I send /api/publications_service/uploads/foo.jpg -> Gateway -> Service /uploads/foo.jpg. 
                    // AND `app.use('/uploads')` handles it.
                    // BUT DB stores `/publications_service/uploads/foo.jpg`.
                    // So if I append that to BASE_URL + '/api', I get `/api/publications_service/uploads/...` which seems correct.
                    // Wait, DB stores `/publications_service/uploads`.
                    // So `http://localhost:8888/api` + `/publications_service/uploads/foo.jpg` = `http://localhost:8888/api/publications_service/uploads/foo.jpg`.
                    // This looks correct.
                    EXISTING_IMAGE_URLS.push(`${BASE_URL}/api${p.image}`);
                }
            });
            console.log(`Collected ${EXISTING_IMAGE_URLS.length} existing image URLs.`);
        }
    } catch (e) {
        console.error("Failed to collect images:", e.message);
    }
}

class UserBot {
    constructor(id) {
        this.id = id;
        this.email = `user_${Date.now()}_${id}_${randomString()}@stress.com`;
        this.password = 'password123';
        this.name = `StressBot ${id}`;
        this.token = null;
        this.userId = null;
        this.apiHeaders = {
            'Content-Type': 'application/json'
        };
    }

    async register() {
        try {
            const res = await fetch(ENDPOINTS.auth.register, {
                method: 'POST',
                headers: this.apiHeaders,
                body: JSON.stringify({
                    name_up: this.name,
                    email_up: this.email,
                    password_up: this.password
                })
            });
            stats.totalRequests++;
            if (res.ok) {
                const data = await res.json();
                if (data.user && data.user.id) this.userId = data.user.id;
                // Some implementations return token on register
                if (data.token) {
                    this.token = `Bearer ${data.token}`;
                    this.apiHeaders['Authorization'] = this.token;
                }
                stats.registered++;
                return true;
            } else {
                if (res.status === 429) stats.rateLimited++;
                const text = await res.text();
                // Limit error logs to avoid spam
                if (stats.errors < 10) console.error(`[${this.id}] Register failed: ${res.status} - ${text.substring(0, 100)}`);
                return false;
            }
        } catch (e) {
            stats.errors++;
            return false;
        }
    }

    async login() {
        try {
            const res = await fetch(ENDPOINTS.auth.login, {
                method: 'POST',
                headers: this.apiHeaders,
                body: JSON.stringify({
                    email: this.email,
                    password: this.password
                })
            });
            stats.totalRequests++;

            if (res.ok) {
                const data = await res.json();
                if (data.token) {
                    this.token = `Bearer ${data.token}`;
                    this.apiHeaders['Authorization'] = this.token;
                } else {
                    // Check cookie
                    const setCookie = res.headers.get('set-cookie');
                    if (setCookie) this.apiHeaders['Cookie'] = setCookie;
                }

                if (data.user && data.user.id) {
                    this.userId = data.user.id;
                }

                stats.logins++;
                return true;
            }
            if (res.status === 429) stats.rateLimited++;
            const text = await res.text();
            // Limit error logs
            if (stats.errors < 10) console.error(`[${this.id}] Login failed: ${res.status} - ${text.substring(0, 100)}`);
            return false;
        } catch (e) {
            stats.errors++;
            return false;
        }
    }

    async createPublication() {
        if (!this.token) return;
        try {
            const formData = new FormData();
            formData.append('name', `Stress Pub ${randomString()}`);
            formData.append('category', 'Maquinaria');
            formData.append('type_product', 'Excavadora');
            formData.append('model', `Model ${randomString()}`);
            formData.append('price', (Math.random() * 1000).toFixed(2));
            formData.append('country', 'Venezuela');
            formData.append('state', 'Bolivar');
            formData.append('city', 'Caroní');
            formData.append('manufacturer', 'StressTest Corp');
            formData.append('contact', this.email);
            formData.append('description', "Created by stress test script");

            const imageBuffer = Buffer.from(ONE_PIXEL_JPG, 'base64');
            const dummyImage = new Blob([imageBuffer], { type: 'image/jpeg' });
            formData.append('image', dummyImage, 'stress.jpg');

            const headers = { ...this.apiHeaders };
            delete headers['Content-Type']; // Let browser/node set boundary

            const res = await fetch(ENDPOINTS.publications.base, {
                method: 'POST',
                headers: headers,
                body: formData
            });
            stats.totalRequests++;

            if (res.ok) {
                stats.publicationsCreated++;
            } else {
                if (res.status === 429) stats.rateLimited++;
                stats.errors++;
            }
        } catch (e) {
            stats.errors++;
        }
    }

    async createOrder() {
        if (!this.token || !this.userId) return;
        try {
            // Random items
            const items = [{
                machine_id: Math.floor(Math.random() * 100) + 1,
                seller_id: Math.floor(Math.random() * 100) + 1,
                quantity: Math.floor(Math.random() * 5) + 1
            }];

            const res = await fetch(ENDPOINTS.orders.base, {
                method: 'POST',
                headers: this.apiHeaders,
                body: JSON.stringify({
                    user_id: this.userId,
                    items: items
                })
            });
            stats.totalRequests++;

            if (res.ok || res.status === 201) {
                stats.orderschreated++;
            } else {
                if (res.status === 429) stats.rateLimited++;
                else stats.errors++;
            }
        } catch (e) {
            stats.errors++;
        }
    }

    async fetchImages() {
        if (EXISTING_IMAGE_URLS.length === 0) return;

        // Pick 3 random images
        for (let i = 0; i < 3; i++) {
            const url = EXISTING_IMAGE_URLS[Math.floor(Math.random() * EXISTING_IMAGE_URLS.length)];
            try {
                // Determine if HEAD or GET. GET puts more load.
                const res = await fetch(url, { method: 'GET' });
                stats.totalRequests++;
                if (res.ok) stats.imagesFetched++;
                else {
                    if (res.status === 429) stats.rateLimited++;
                    stats.errors++;
                }
            } catch (e) {
                stats.errors++;
            }
        }
    }

    async runLifeCycle() {
        if (await this.register()) {
            if (await this.login()) {
                for (let i = 0; i < ACTIONS_PER_USER; i++) {
                    const r = Math.random();
                    if (r < 0.2) await this.createPublication(); // 20% create pub
                    else if (r < 0.4) await this.createOrder(); // 20% create order
                    else if (r < 0.8) await this.fetchImages(); // 40% fetch images (Heavy load)
                    else {
                        // 20% just read
                        try {
                            await fetch(ENDPOINTS.publications.base, { headers: this.apiHeaders });
                            stats.totalRequests++;
                            stats.reads++;
                        } catch (e) { stats.errors++; }
                    }
                    await sleep(10); // Small delay
                }
            }
        }
    }
}

async function main() {
    await collectImageUrls();

    console.log(`Starting stress test: ${TARGET_TOTAL_USERS} users, concurrency ${CONCURRENCY}`);
    console.log(`Existing Images to fetch: ${EXISTING_IMAGE_URLS.length}`);

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
    }

    // Monitor
    const interval = setInterval(() => {
        const elapsed = (Date.now() - stats.startTime) / 1000;
        const rps = (stats.totalRequests / elapsed).toFixed(1);
        process.stdout.write(`\r[${elapsed.toFixed(0)}s] Req: ${stats.totalRequests} | Reg: ${stats.registered} | Log: ${stats.logins} | Orders: ${stats.orderschreated} | Img: ${stats.imagesFetched} | Err: ${stats.errors}   `);
    }, 1000);

    await Promise.all(workers);
    clearInterval(interval);

    console.log("\n\n--- TEST COMPLETE ---");
    console.log(`Total Requests: ${stats.totalRequests}`);
    console.log(`Duration: ${((Date.now() - stats.startTime) / 1000).toFixed(2)}s`);
    console.log(`RPS: ${(stats.totalRequests / ((Date.now() - stats.startTime) / 1000)).toFixed(1)}`);
    console.log(`Registered: ${stats.registered}`);
    console.log(`Logins: ${stats.logins}`);
    console.log(`Orders Created: ${stats.orderschreated}`);
    console.log(`Images Fetched: ${stats.imagesFetched}`);
    console.log(`Rate Limited (429): ${stats.rateLimited}`);
    console.log(`Other Errors: ${stats.errors}`);
}

main();
