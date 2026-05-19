import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seed: starting...')
  // Phase 2 will add grade_mappings seed.
  // Phase 2 will add clubs seed (empty until real club data is provided).
  console.log('Seed: nothing to seed yet — models are added in Phase 2.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
