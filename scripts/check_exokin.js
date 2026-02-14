const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const exokin = await prisma.exokin.findFirst({
        orderBy: { createdAt: 'desc' },
    });
    console.log(JSON.stringify(exokin, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
