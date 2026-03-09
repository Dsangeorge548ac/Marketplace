/**
 * stress_test.mjs  —  Marketplace Stress & Security Test Suite
 */

const BASE = 'http://localhost:8888';
const PUB_API = `${BASE}/api/publications_service/`;
const AUTH_API = `${BASE}/api/user_service/auth/`;

let passed = 0;
let failed = 0;
let warnings = 0;
const results = [];

function log(category, label, status, detail = '') {
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️ ';
    console.log(`  ${icon} [${category}] ${label}${detail ? ' — ' + detail : ''}`);
    results.push({ category, label, status, detail });
    if (status === 'PASS') passed++;
    else if (status === 'FAIL') failed++;
    else warnings++;
}

async function fetchT(url, opts = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...opts, signal: controller.signal });
        clearTimeout(tid);
        return res;
    } catch (e) {
        clearTimeout(tid);
        throw e;
    }
}

// 1. CONCURRENT GET BURST
async function testConcurrentGets() {
    console.log('\n📦 [1] Concurrent GET burst (200 requests)');
    const N = 200;
    const start = Date.now();
    const reqs = Array.from({ length: N }, () =>
        fetchT(PUB_API).then(r => r.status).catch(() => 0)
    );
    const statuses = await Promise.all(reqs);
    const elapsed = Date.now() - start;
    const ok = statuses.filter(s => s === 200).length;
    const rate = statuses.filter(s => s === 429).length;
    const errs = statuses.filter(s => s === 0 || (s >= 500)).length;

    log('Load', `${N} concurrent GETs in ${elapsed}ms`, ok > 0 ? 'PASS' : 'FAIL', `200:${ok} 429:${rate} 5xx/err:${errs}`);
    if (errs > 20) log('Load', 'Server error rate', 'FAIL', `${errs} requests returned 5xx/timeout`);
    else log('Load', 'Server error rate', 'PASS', `${errs} errors out of ${N}`);
    if (rate > 0) log('Load', 'Rate-limit triggered', 'WARN', `${rate} requests got 429`);
}

// 2. AUTH BRUTE-FORCE
async function testAuthBruteForce() {
    console.log('\n🔐 [2] Auth brute-force simulation (50 rapid POSTs)');
    const loginUrl = `${AUTH_API}login`;
    const payload = JSON.stringify({ email: 'test@test.com', password: 'wrongpassword' });
    const reqs = Array.from({ length: 50 }, () =>
        fetchT(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
        }).then(r => r.status).catch(() => 0)
    );
    const statuses = await Promise.all(reqs);
    const rate429 = statuses.filter(s => s === 429).length;
    const nonAuth = statuses.filter(s => s === 401 || s === 400 || s === 403).length;
    const errors = statuses.filter(s => s === 0 || s >= 500).length;

    if (rate429 > 0) log('Security', 'Auth rate-limit active (429)', 'PASS', `${rate429}/50 blocked`);
    else if (nonAuth > 0) log('Security', 'Auth rejects wrong credentials', 'PASS', `${nonAuth}/50 rejected`);
    else log('Security', 'Auth rate-limit', 'WARN', 'No 429 observed');
    if (errors > 5) log('Security', 'Auth server errors during brute-force', 'FAIL', `${errors} 5xx`);
    else log('Security', 'Auth server stability', 'PASS', `Only ${errors} server errors`);
}

// 3. SQL INJECTION PROBES
async function testSQLInjection() {
    console.log('\n💉 [3] SQL injection probes on ?search=');
    const payloads = [
        `' OR '1'='1`,
        `' OR 1=1 --`,
        `'; DROP TABLE products; --`,
        `" OR ""="`,
        `1 UNION SELECT null,null,null,null --`,
        `' HAVING 1=1 --`,
        `admin'--`,
        `%27%20OR%20%271%27%3D%271`,
    ];
    for (const p of payloads) {
        try {
            const res = await fetchT(`${PUB_API}?search=${encodeURIComponent(p)}`);
            const body = await res.text();
            const injected = body.toLowerCase().includes('mysql') ||
                body.toLowerCase().includes('syntax error') ||
                body.toLowerCase().includes('you have an error in your sql');
            if (injected) log('SQL', p.substring(0, 35), 'FAIL', 'SQL error leaked in response');
            else if (res.status < 500) log('SQL', p.substring(0, 35), 'PASS', `HTTP ${res.status}, no SQL leak`);
            else log('SQL', p.substring(0, 35), 'FAIL', `HTTP ${res.status}`);
        } catch { log('SQL', p.substring(0, 35), 'WARN', 'timeout/connection error'); }
    }
}

// 4. XSS PROBES
async function testXSS() {
    console.log('\n🕷️  [4] XSS probes on ?search=');
    const payloads = [
        `<script>alert(1)</script>`,
        `"><img src=x onerror=alert(1)>`,
        `javascript:alert(1)`,
        `<svg onload=alert(1)>`,
    ];
    for (const p of payloads) {
        try {
            const res = await fetchT(`${PUB_API}?search=${encodeURIComponent(p)}`);
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('application/json')) log('XSS', p.substring(0, 35), 'PASS', 'Response is JSON, not raw HTML');
            else log('XSS', p.substring(0, 35), 'WARN', `Content-Type: ${ct}`);
        } catch { log('XSS', p.substring(0, 35), 'WARN', 'timeout'); }
    }
}

// 5. UNAUTHENTICATED PROTECTED ROUTES
async function testAuthProtection() {
    console.log('\n🛡️  [5] Unauthenticated access to protected routes');
    const tests = [
        { method: 'POST', url: PUB_API, label: 'POST /publications_service/ (create)' },
        { method: 'PUT', url: `${PUB_API}999`, label: 'PUT /publications_service/999 (update)' },
        { method: 'DELETE', url: `${PUB_API}999`, label: 'DELETE /publications_service/999 (delete)' },
    ];
    for (const t of tests) {
        try {
            const res = await fetchT(t.url, {
                method: t.method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'hack', price: 0 })
            });
            if (res.status === 401 || res.status === 403) log('Auth', t.label, 'PASS', `Correctly returned ${res.status}`);
            else log('Auth', t.label, 'FAIL', `Expected 401/403, got ${res.status}`);
        } catch { log('Auth', t.label, 'WARN', 'timeout/error'); }
    }
}

// 6. PAGINATION BOUNDARY
async function testPaginationBoundary() {
    console.log('\n📄 [6] Pagination boundary & extreme params');
    const cases = [
        { q: '?page=9999999&limit=9999999', label: 'page=9M limit=9M' },
        { q: '?page=-1&limit=-50', label: 'negative page/limit' },
        { q: '?page=abc&limit=xyz', label: 'non-numeric page/limit' },
        { q: '?minPrice=-99999&maxPrice=abc', label: 'negative minPrice / non-numeric maxPrice' },
        { q: '?limit=0', label: 'limit=0' },
    ];
    for (const c of cases) {
        try {
            const res = await fetchT(`${PUB_API}${c.q}`);
            log('Validation', c.label, res.status < 500 ? 'PASS' : 'FAIL', `HTTP ${res.status}`);
        } catch { log('Validation', c.label, 'WARN', 'timeout'); }
    }
}

// 7. INVALID HTTP METHODS
async function testInvalidMethods() {
    console.log('\n🔒 [7] Invalid HTTP methods');
    const methods = ['PATCH', 'OPTIONS', 'HEAD', 'TRACE'];
    for (const m of methods) {
        try {
            const res = await fetchT(PUB_API, { method: m });
            log('Methods', `${m} ${PUB_API}`, res.status < 500 ? 'PASS' : 'WARN', `HTTP ${res.status}`);
        } catch { log('Methods', m, 'WARN', 'timeout/error'); }
    }
}

// 8. OVERSIZED PAYLOAD
async function testOversizedPayload() {
    console.log('\n📦 [8] Oversized JSON payload (~2MB POST)');
    const bigPayload = JSON.stringify({ name: 'X'.repeat(2 * 1024 * 1024) });
    try {
        const res = await fetchT(PUB_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: bigPayload,
        });
        if (res.status === 401 || res.status === 403 || res.status === 413)
            log('Payload', '2MB payload rejected', 'PASS', `HTTP ${res.status}`);
        else if (res.status >= 500)
            log('Payload', '2MB payload caused server error', 'FAIL', `HTTP ${res.status}`);
        else
            log('Payload', '2MB payload', 'WARN', `HTTP ${res.status}`);
    } catch { log('Payload', '2MB payload', 'WARN', 'timeout or connection refused'); }
}

// ─── MAIN ───
console.log('='.repeat(62));
console.log('  🔬 Marketplace Stress & Security Test Suite');
console.log(`  Target: ${BASE}`);
console.log(`  Time:   ${new Date().toISOString()}`);
console.log('='.repeat(62));

await testConcurrentGets();
await testAuthBruteForce();
await testSQLInjection();
await testXSS();
await testAuthProtection();
await testPaginationBoundary();
await testInvalidMethods();
await testOversizedPayload();

console.log('\n' + '='.repeat(62));
console.log('  📊 FINAL REPORT');
console.log('='.repeat(62));
console.log(`  ✅ PASSED  : ${passed}`);
console.log(`  ❌ FAILED  : ${failed}`);
console.log(`  ⚠️  WARNINGS: ${warnings}`);
console.log('='.repeat(62));

if (failed > 0) {
    console.log('\n  ❌ FAILURES:');
    results.filter(r => r.status === 'FAIL').forEach(r =>
        console.log(`     [${r.category}] ${r.label}  ← ${r.detail}`)
    );
}
if (warnings > 0) {
    console.log('\n  ⚠️  WARNINGS:');
    results.filter(r => r.status === 'WARN').forEach(r =>
        console.log(`     [${r.category}] ${r.label}  ← ${r.detail}`)
    );
}
console.log('');
