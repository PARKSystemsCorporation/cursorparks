import fs from 'fs';
import path from 'path';
import { processMessage } from '../src/lib/aria/correlator'; // Correct relative path from scripts/ to src/

const SEED_DIR = path.join(process.cwd(), 'prisma', 'seeds', 'aria');

async function seedAria() {
    console.log("🌱 Starting ARIA Seeding...");

    if (!fs.existsSync(SEED_DIR)) {
        console.error(`❌ Seed directory not found: ${SEED_DIR}`);
        return;
    }

    const files = fs.readdirSync(SEED_DIR).filter(f => f.endsWith('.txt'));
    console.log(`Found ${files.length} seed files: ${files.join(', ')}`);

    let totalLines = 0;

    for (const file of files) {
        console.log(`\nProcessing ${file}...`);
        const content = fs.readFileSync(path.join(SEED_DIR, file), 'utf-8');
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        for (const line of lines) {
            await processMessage(line);
            process.stdout.write('.');
            totalLines++;
        }
    }

    console.log(`\n\n✅ Seeding Complete! Processed ${totalLines} lines.`);
}

seedAria()
    .catch(e => console.error(e))
    .finally(() => process.exit(0));
