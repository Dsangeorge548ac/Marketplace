import puppeteer from 'puppeteer';

const TARGET_URL = 'http://localhost:5173/marketplace';

const errors = [];
const warnings = [];

function logError(err) {
    errors.push(err);
    console.error(`❌ [FRONTEND ERROR]: ${err}`);
}

(async () => {
    console.log('🚀 Starting Frontend Stress Test with Puppeteer...');

    // Launch headless browser
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Catch Vue / JS errors
    page.on('pageerror', error => {
        logError(error.message);
    });

    // Catch console errors (could be Vue warnings or network errors)
    page.on('console', msg => {
        if (msg.type() === 'error') {
            logError(msg.text());
        } else if (msg.type() === 'warning') {
            warnings.push(msg.text());
        }
    });

    try {
        console.log(`Navigating to ${TARGET_URL}...`);
        await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });
        console.log('✅ Page loaded.');

        // TEST 1: Rapid Input on Search (tests Debounce / API race conditions)
        console.log('⚡ Test 1: Rapid Search Input Spam');
        const searchInput = await page.$('input[placeholder="Buscar productos, marcas..."]');
        if (searchInput) {
            for (let i = 0; i < 20; i++) {
                await searchInput.type('excavadora', { delay: 10 });
                await page.keyboard.press('Backspace');
                await page.keyboard.press('Backspace');
            }
        } else {
            console.log('⚠️ Search input not found, skipping Test 1.');
        }

        // TEST 2: Rapid clicking of Categories / Subcategories
        console.log('⚡ Test 2: Rapid Filter Checkbox Clicking');
        const checkboxes = await page.$$('input[type="checkbox"]');
        if (checkboxes.length > 0) {
            // Spam click the first 5 checkboxes as fast as possible
            for (let i = 0; i < 50; i++) {
                const randomCheckbox = checkboxes[Math.floor(Math.random() * Math.min(5, checkboxes.length))];
                await randomCheckbox.click().catch(() => { });
            }
        } else {
            console.log('⚠️ No checkboxes found, skipping Test 2.');
        }

        // TEST 3: Modal Spam (Open / Close rapidly)
        console.log('⚡ Test 3: Rapid Product Modal Open/Close');
        const productCards = await page.$$('.publication-card, .product-card, .card');
        if (productCards.length > 0) {
            for (let i = 0; i < 10; i++) {
                await productCards[0].click().catch(() => { });
                await new Promise(r => setTimeout(r, 50)); // wait for modal animation slightly
                // Try to find close button
                const closeBtn = await page.$('.modal .close-button, .modal-close');
                if (closeBtn) await closeBtn.click().catch(() => { });
                await new Promise(r => setTimeout(r, 50));
            }
        } else {
            console.log('⚠️ No product cards found, skipping Test 3.');
        }

        // TEST 4: Navigation Spam
        console.log('⚡ Test 4: Rapid Navigation / Route Traversal');
        for (let i = 0; i < 5; i++) {
            await page.evaluate(() => {
                if (window.location.hash) {
                    window.location.hash = '#/';
                } else {
                    window.location.href = '/';
                }
            });
            await new Promise(r => setTimeout(r, 100));
            await page.evaluate(() => {
                if (window.location.hash) {
                    window.location.hash = '#/marketplace';
                } else {
                    window.location.href = '/marketplace';
                }
            });
            await new Promise(r => setTimeout(r, 200));
        }

        console.log('⏳ Waiting for final network calls to settle...');
        await new Promise(r => setTimeout(r, 3000));

    } catch (e) {
        console.error('Test script encountered an error:', e.message);
    } finally {
        await browser.close();

        console.log('\n======================================');
        console.log('📊 FRONTEND STRESS TEST RESULTS');
        console.log('======================================');

        if (errors.length === 0) {
            console.log('✅ PASS: No frontend JS errors or crashes detected during aggressive interaction.');
        } else {
            console.log(`❌ FAIL: Detected ${errors.length} frontend errors:`);
            const uniqueErrors = [...new Set(errors)];
            uniqueErrors.forEach((e, i) => console.log(`   ${i + 1}. ${e}`));
        }

        if (warnings.length > 0) {
            console.log(`\n⚠️  Also caught ${warnings.length} warnings (mostly Vue dev warnings or network 404s).`);
        }
        console.log('======================================');
    }
})();
