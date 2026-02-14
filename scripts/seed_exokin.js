
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const existing = await prisma.exokin.findFirst();
        if (existing) {
            console.log('Exokin already exists:', existing);
            return;
        }

        const exokin = await prisma.exokin.create({
            data: {
                name: 'TestUnit',
                gender: 'male',
                type: 'companion',
                morphologySeed: 'test-seed-123',
                neurochemistryBase: '{}',
                userId: 'test-user-id', // Assuming optional or we need a user
            },
        });
        console.log('Created Exokin:', exokin);
    } catch (e) {
        console.error('Error seeding Exokin:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
