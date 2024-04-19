const { chromium } = require('playwright');
async function run(i) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ 
    recordVideo: { 
      dir: '.', 
      size: { width: 1920, height: 1080 }, 
      fps: 30
    } 
  });
  const page = await context.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('https://currentmillis.com/');
  await page.waitForTimeout(1000);
  console.log("Browser start video")

  const video = await page.video();
  if (video) {
    await video.saveAs(`example${i}.webm`).catch(console.error); 
  }
  console.log("Browser close")
  await browser.close();
}

// Run 10 instances of the run function concurrently
Promise.all(Array.from({ length: 10 }, (_, i) => run(i))).catch(console.error);