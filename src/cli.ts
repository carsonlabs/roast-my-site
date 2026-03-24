import { program } from "commander";
import chalk from "chalk";
import ora from "ora";
import * as cheerio from "cheerio";

// ============================================================
// ROAST VARIATIONS - Gordon Ramsay would be proud
// ============================================================

const roasts = {
  nestedDivs: [
    (depth: number) =>
      `This isn't HTML, it's a LASAGNA. ${depth} layers of nested divs!`,
    (depth: number) =>
      `${depth} levels of div nesting? I've seen RUSSIAN DOLLS with less layers!`,
    (depth: number) =>
      `${depth} nested divs! Were you trying to build INCEPTION in HTML?`,
  ],
  largeImages: [
    (mb: string, src: string) =>
      `Your image is ${mb}MB. Were you trying to send a SATELLITE PHOTO? (${truncate(src, 50)})`,
    (mb: string, src: string) =>
      `${mb}MB for ONE image?! My grandmother's DIAL-UP just cried. (${truncate(src, 50)})`,
    (mb: string, src: string) =>
      `${mb}MB! That image weighs more than my WILL TO LIVE after seeing this code. (${truncate(src, 50)})`,
  ],
  missingMetaDescription: [
    () =>
      `Google doesn't know what you do. After reading this markup, neither do I.`,
    () =>
      `No meta description? Even a BLANK PIECE OF PAPER tells you more about itself!`,
    () =>
      `Missing meta description. Your site is playing HIDE AND SEEK with search engines.`,
  ],
  missingAltTags: [
    (count: number) =>
      `${count} images without alt text. Even SCREEN READERS gave up on your site.`,
    (count: number) =>
      `${count} images with no alt text! The visually impaired community sends their REGARDS.`,
    (count: number) =>
      `${count} images, ZERO descriptions. It's like a restaurant menu with no FOOD NAMES!`,
  ],
  inlineStyles: [
    (count: number) =>
      `${count} inline styles? Were you DRUNK when you wrote this CSS?`,
    (count: number) =>
      `${count} inline styles! Your stylesheet must feel NEGLECTED AND ABANDONED.`,
    (count: number) =>
      `${count} inline styles. You've heard of CSS files, right? RIGHT?!`,
  ],
  deprecatedTags: [
    (tag: string) =>
      `A <${tag}> tag? What YEAR do you think this is?`,
    (tag: string) =>
      `You're using <${tag}>?! I haven't seen that since NETSCAPE NAVIGATOR!`,
    (tag: string) =>
      `A <${tag}> tag! Did you dig this code out of a TIME CAPSULE from 1998?`,
  ],
  noViewport: [
    () =>
      `No viewport meta tag. Your mobile users are SQUINTING.`,
    () =>
      `No viewport tag? Mobile users have to zoom in like they're examining a CRIME SCENE!`,
    () =>
      `Missing viewport meta. Congratulations, your site looks like a POSTAGE STAMP on phones!`,
  ],
  excessiveScripts: [
    (count: number) =>
      `${count} script tags. Your website loads slower than a MICROWAVE.`,
    (count: number) =>
      `${count} scripts?! Your browser needs a LIE DOWN after loading this page!`,
    (count: number) =>
      `${count} script tags! That's not a website, that's a JAVASCRIPT SUPPORT GROUP!`,
  ],
  noFavicon: [
    () =>
      `No favicon? You couldn't even give your site a FACE?`,
    () =>
      `No favicon! Your browser tab is as BLANK as the look on my face reading this HTML.`,
    () =>
      `Missing favicon. Your site shows up in browser tabs looking like an ORPHAN.`,
  ],
  emptyLinks: [
    (count: number) =>
      `${count} empty links. They go NOWHERE, just like this website.`,
    (count: number) =>
      `${count} links to absolutely NOTHING. It's a ROAD TO NOWHERE built in HTML!`,
    (count: number) =>
      `${count} empty links! Even a DEAD END has more direction than your navigation!`,
  ],
  missingLang: [
    () =>
      `No lang attribute. Your website doesn't even know what LANGUAGE it speaks.`,
    () =>
      `Missing lang attribute! Your HTML is having an IDENTITY CRISIS.`,
    () =>
      `No lang attribute on <html>. Your browser is GUESSING the language like a tourist in a foreign country!`,
  ],
  missingH1: [
    () =>
      `No h1 tag. Your page has NO HEADING, no DIRECTION, no HOPE.`,
    () =>
      `Missing h1! Your content hierarchy is NONEXISTENT, like your attention to detail!`,
    () =>
      `No h1 tag. This page is more HEADLESS than a chicken in my kitchen!`,
  ],
};

const finalScoreQuotes: Record<string, string[]> = {
  perfect: [
    `Finally, some good f***ing HTML.`,
    `Beautiful. I'm not crying, there's just CLEAN CODE in my eye.`,
  ],
  good: [
    `It's acceptable. Barely.`,
    `Not terrible. I've seen worse. I've also seen BETTER.`,
  ],
  mediocre: [
    `I've seen better websites made by CHILDREN.`,
    `This is what happens when you learn HTML from a CEREAL BOX.`,
  ],
  bad: [
    `This website is so raw, it's still MOOING.`,
    `My nan could build a better site, and she's been DEAD for 10 years!`,
  ],
  terrible: [
    `Shut it DOWN. Shut the whole thing DOWN.`,
    `This website should be a CRIME SCENE. Where's the yellow tape?!`,
  ],
  catastrophic: [
    `I need to lie down. This is the worst thing I've ever seen.`,
    `DISGUSTING. I wouldn't serve this website to my WORST ENEMY.`,
  ],
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + "..." : str;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printRoast(message: string): void {
  console.log(chalk.red(`  \u{1F525} ${message}`));
  console.log();
}

function printPass(message: string): void {
  console.log(chalk.green(`  \u2705 ${message}`));
  console.log();
}

// ============================================================
// CHECK FUNCTIONS
// ============================================================

function getMaxDivDepth($: cheerio.CheerioAPI): number {
  let maxDepth = 0;
  $("div").each((_, el) => {
    let depth = 0;
    let current = $(el);
    while (current.parent().length && current.parent().prop("tagName") !== undefined) {
      if (current.parent().is("div")) depth++;
      current = current.parent();
    }
    // Count self
    depth++;
    if (depth > maxDepth) maxDepth = depth;
  });
  return maxDepth;
}

async function checkImageSizes(
  $: cheerio.CheerioAPI,
  baseUrl: string
): Promise<{ src: string; sizeMb: string }[]> {
  const largeImages: { src: string; sizeMb: string }[] = [];
  const imgSrcs: string[] = [];

  $("img[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (src && imgSrcs.length < 5) {
      imgSrcs.push(src);
    }
  });

  for (const src of imgSrcs) {
    try {
      let fullUrl = src;
      if (src.startsWith("//")) {
        fullUrl = "https:" + src;
      } else if (src.startsWith("/")) {
        const u = new URL(baseUrl);
        fullUrl = u.origin + src;
      } else if (!src.startsWith("http")) {
        fullUrl = new URL(src, baseUrl).href;
      }

      const response = await fetch(fullUrl, { method: "HEAD", signal: AbortSignal.timeout(5000) });
      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        const sizeBytes = parseInt(contentLength, 10);
        if (sizeBytes > 1_000_000) {
          largeImages.push({
            src: src,
            sizeMb: (sizeBytes / 1_000_000).toFixed(1),
          });
        }
      }
    } catch {
      // Skip images we can't reach
    }
  }

  return largeImages;
}

function countMissingAlt($: cheerio.CheerioAPI): number {
  let count = 0;
  $("img").each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined || alt === "") count++;
  });
  return count;
}

function countInlineStyles($: cheerio.CheerioAPI): number {
  return $("[style]").length;
}

function findDeprecatedTags($: cheerio.CheerioAPI): string[] {
  const deprecated = ["center", "font", "marquee", "blink", "frameset"];
  const found: string[] = [];
  for (const tag of deprecated) {
    if ($(tag).length > 0) found.push(tag);
  }
  return found;
}

function hasViewportMeta($: cheerio.CheerioAPI): boolean {
  return $('meta[name="viewport"]').length > 0;
}

function countScripts($: cheerio.CheerioAPI): number {
  return $("script").length;
}

function hasFavicon($: cheerio.CheerioAPI): boolean {
  return (
    $('link[rel="icon"]').length > 0 ||
    $('link[rel="shortcut icon"]').length > 0 ||
    $('link[rel="apple-touch-icon"]').length > 0
  );
}

function countEmptyLinks($: cheerio.CheerioAPI): number {
  let count = 0;
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (href === "#" || href === "" || href === undefined) count++;
  });
  return count;
}

function hasLangAttribute($: cheerio.CheerioAPI): boolean {
  const lang = $("html").attr("lang");
  return lang !== undefined && lang !== "";
}

function hasH1($: cheerio.CheerioAPI): boolean {
  return $("h1").length > 0;
}

function hasMetaDescription($: cheerio.CheerioAPI): boolean {
  return $('meta[name="description"]').length > 0;
}

// ============================================================
// MAIN ROAST ENGINE
// ============================================================

async function roastSite(url: string): Promise<void> {
  console.log();
  console.log(
    chalk.bold.yellow(
      `  \u{1F468}\u200D\u{1F373} CHEF RAMSAY'S WEBSITE INSPECTION`
    )
  );
  console.log(chalk.yellow(`  ════════════════════════════════════════`));
  console.log(chalk.dim(`  Target: ${url}`));
  console.log();

  // Fetch the page
  const fetchSpinner = ora({
    text: chalk.cyan("Fetching that excuse of a website..."),
    indent: 2,
  }).start();

  let html: string;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RoastMyBot/1.0; +https://github.com/roast-my-site)",
      },
      signal: AbortSignal.timeout(15000),
    });
    html = await response.text();
    fetchSpinner.succeed(
      chalk.cyan(`Fetched ${(html.length / 1024).toFixed(0)}KB of questionable HTML`)
    );
  } catch (err: any) {
    fetchSpinner.fail(chalk.red(`Couldn't fetch the site. ${err.message}`));
    console.log(
      chalk.red(
        `\n  Even Gordon can't roast what he can't SEE. Check the URL and try again.\n`
      )
    );
    process.exit(1);
  }

  const $ = cheerio.load(html);
  let score = 10;
  let issueCount = 0;

  await sleep(500);

  const inspectSpinner = ora({
    text: chalk.cyan("Inspecting the damage..."),
    indent: 2,
  }).start();
  await sleep(1500);
  inspectSpinner.stop();
  console.log();

  // ── 1. Nested Divs ──
  const divDepth = getMaxDivDepth($);
  if (divDepth > 10) {
    printRoast(pickRandom(roasts.nestedDivs)(divDepth));
    score -= 1;
    issueCount++;
  } else {
    printPass(`Div nesting depth: ${divDepth}. Acceptable layering.`);
  }

  // ── 2. Large Images ──
  const imgSpinner = ora({
    text: chalk.cyan("Weighing your images..."),
    indent: 2,
  }).start();
  const largeImages = await checkImageSizes($, url);
  imgSpinner.stop();

  if (largeImages.length > 0) {
    for (const img of largeImages) {
      printRoast(pickRandom(roasts.largeImages)(img.sizeMb, img.src));
      score -= 1;
      issueCount++;
    }
  } else {
    printPass("Image sizes look reasonable. Miracle.");
  }

  // ── 3. Meta Description ──
  if (!hasMetaDescription($)) {
    printRoast(pickRandom(roasts.missingMetaDescription)());
    score -= 1;
    issueCount++;
  } else {
    printPass("Meta description found. At least Google knows you exist.");
  }

  // ── 4. Missing Alt Tags ──
  const missingAlts = countMissingAlt($);
  if (missingAlts > 0) {
    printRoast(pickRandom(roasts.missingAltTags)(missingAlts));
    score -= 1;
    issueCount++;
  } else {
    printPass("All images have alt text. Accessibility champion!");
  }

  // ── 5. Inline Styles ──
  const inlineCount = countInlineStyles($);
  if (inlineCount > 0) {
    printRoast(pickRandom(roasts.inlineStyles)(inlineCount));
    score -= 1;
    issueCount++;
  } else {
    printPass("No inline styles. Your CSS file must be so PROUD.");
  }

  // ── 6. Deprecated Tags ──
  const deprecated = findDeprecatedTags($);
  if (deprecated.length > 0) {
    for (const tag of deprecated) {
      printRoast(pickRandom(roasts.deprecatedTags)(tag));
      score -= 1;
      issueCount++;
    }
  } else {
    printPass("No deprecated tags. Welcome to the 21st century.");
  }

  // ── 7. Viewport Meta ──
  if (!hasViewportMeta($)) {
    printRoast(pickRandom(roasts.noViewport)());
    score -= 1;
    issueCount++;
  } else {
    printPass("Viewport meta tag present. Your mobile users thank you.");
  }

  // ── 8. Excessive Scripts ──
  const scriptCount = countScripts($);
  if (scriptCount > 15) {
    printRoast(pickRandom(roasts.excessiveScripts)(scriptCount));
    score -= 1;
    issueCount++;
  } else {
    printPass(`${scriptCount} script tags. Manageable, for now.`);
  }

  // ── 9. Favicon ──
  if (!hasFavicon($)) {
    printRoast(pickRandom(roasts.noFavicon)());
    score -= 1;
    issueCount++;
  } else {
    printPass("Favicon found. Your tab has a face!");
  }

  // ── 10. Empty Links ──
  const emptyLinkCount = countEmptyLinks($);
  if (emptyLinkCount > 0) {
    printRoast(pickRandom(roasts.emptyLinks)(emptyLinkCount));
    score -= 1;
    issueCount++;
  } else {
    printPass("No empty links. Every link goes somewhere. Incredible.");
  }

  // ── 11. Lang Attribute ──
  if (!hasLangAttribute($)) {
    printRoast(pickRandom(roasts.missingLang)());
    score -= 1;
    issueCount++;
  } else {
    printPass("Lang attribute present. Your HTML knows who it is.");
  }

  // ── 12. H1 Tag ──
  if (!hasH1($)) {
    printRoast(pickRandom(roasts.missingH1)());
    score -= 1;
    issueCount++;
  } else {
    printPass("H1 tag found. At least the page has a heading.");
  }

  // ── Final Score ──
  await sleep(300);
  const scoreSpinner = ora({
    text: chalk.cyan("Calculating the final verdict..."),
    indent: 2,
  }).start();
  await sleep(1500);
  scoreSpinner.stop();

  const finalScore = Math.max(0, score);

  console.log(chalk.yellow(`  ════════════════════════════════════════`));
  console.log(
    chalk.bold.yellow(`  \u{1F468}\u200D\u{1F373} CHEF RAMSAY'S FINAL VERDICT`)
  );
  console.log(chalk.yellow(`  ════════════════════════════════════════`));
  console.log();

  // Score bar
  const filled = finalScore;
  const empty = 10 - filled;
  const barColor = finalScore >= 7 ? chalk.green : finalScore >= 4 ? chalk.yellow : chalk.red;
  console.log(
    `  Score: ${barColor.bold(`${finalScore}/10`)} ${barColor("\u2588".repeat(filled))}${chalk.gray("\u2591".repeat(empty))}`
  );
  console.log(chalk.dim(`  Issues found: ${issueCount}`));
  console.log();

  // Final Gordon quote
  let quoteCategory: string;
  if (finalScore >= 9) quoteCategory = "perfect";
  else if (finalScore >= 7) quoteCategory = "good";
  else if (finalScore >= 5) quoteCategory = "mediocre";
  else if (finalScore >= 3) quoteCategory = "bad";
  else if (finalScore >= 1) quoteCategory = "terrible";
  else quoteCategory = "catastrophic";

  const finalQuote = pickRandom(finalScoreQuotes[quoteCategory]);
  console.log(chalk.bold.red(`  "${finalQuote}"`));
  console.log(chalk.dim(`    -- Chef Ramsay, probably`));
  console.log();
}

// ============================================================
// CLI SETUP
// ============================================================

program
  .name("roast-my-site")
  .description("Get your website roasted Gordon Ramsay style \u{1F525}")
  .version("1.0.0")
  .argument("<url>", "URL of the website to roast")
  .action(async (url: string) => {
    // Ensure URL has a protocol
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    try {
      new URL(url);
    } catch {
      console.error(chalk.red(`\n  Invalid URL: ${url}\n`));
      process.exit(1);
    }

    await roastSite(url);
  });

program.parse();
