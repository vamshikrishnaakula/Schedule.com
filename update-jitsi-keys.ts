import { PrismaClient } from '@calcom/prisma';

const prisma = new PrismaClient();

async function updateJitsiKeys() {
  try {
    console.log('Checking for Jitsi app...');

    // First check if the app exists
    const existingApp = await prisma.app.findFirst({
      where: { slug: 'jitsi' }
    });

    if (existingApp) {
      console.log('Jitsi app found. Current keys:', existingApp.keys);

      // Update the keys
      const updatedApp = await prisma.app.update({
        where: { slug: 'jitsi' },
        data: {
          keys: {
            jitsiHost: 'https://meet.leadnest.ai',
            jitsiPathPattern: '{Title}-{uuid}'
          },
          enabled: true
        }
      });

      console.log('✅ Jitsi app updated successfully!');
      console.log('New keys:', updatedApp.keys);
    } else {
      console.log('Jitsi app not found, creating it...');

      // Create the app if it doesn't exist
      const newApp = await prisma.app.create({
        data: {
          slug: 'jitsi',
          dirName: 'jitsivideo',
          categories: ['conferencing'],
          enabled: true,
          keys: {
            jitsiHost: 'https://meet.leadnest.ai',
            jitsiPathPattern: '{Title}-{uuid}'
          }
        }
      });

      console.log('✅ Jitsi app created successfully!');
      console.log('Keys:', newApp.keys);
    }

    // Also check for the leadnestvideo app (the actual app ID used in metadata)
    const leadnestApp = await prisma.app.findFirst({
      where: { dirName: 'leadnestvideo' }
    });

    if (leadnestApp) {
      console.log('Found leadnestvideo app, updating its keys too...');
      await prisma.app.update({
        where: { dirName: 'leadnestvideo' },
        data: {
          keys: {
            jitsiHost: 'https://meet.leadnest.ai',
            jitsiPathPattern: '{Title}-{uuid}'
          },
          enabled: true
        }
      });
      console.log('✅ leadnestvideo app updated!');
    }

  } catch (error) {
    console.error('❌ Error updating Jitsi keys:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateJitsiKeys();