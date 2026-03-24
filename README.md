# roast-my-site

Get your website roasted, Gordon Ramsay style.

A CLI tool that audits your website for common HTML/CSS issues and delivers the results as savage, chef-themed roasts.

## Install

```bash
npm install -g roast-my-site
```

## Usage

```bash
roast-my-site https://example.com
```

That's it. You'll get a score out of 10 and a Gordon Ramsay quote calibrated to how bad your site is.

## What It Checks

| Check | What triggers a roast |
|-------|----------------------|
| Nested divs | More than 10 levels deep |
| Large images | Any image over 1MB |
| Meta description | Missing SEO meta tag |
| Alt tags | Images without alt text |
| Inline styles | CSS in `style` attributes |
| Deprecated tags | `<center>`, `<font>`, `<marquee>`, `<blink>`, `<frameset>` |
| Viewport meta | Missing mobile responsiveness tag |
| Script tags | More than 15 scripts loaded |
| Favicon | No favicon found |
| Empty links | Links pointing to `#` or empty `href` |
| Lang attribute | Missing `lang` on `<html>` |
| H1 tag | No heading hierarchy |

## Example Output

```
  Fetching https://example.com...

  YOUR ROAST IS SERVED

  Missing meta description — "You forgot the meta description?
  That's like opening a restaurant with no sign on the door!"

  No favicon — "No favicon? Even a food truck has a logo, darling."

  Score: 8/10  ████████░░

  "Not bad, chef. You've got some skills, but don't let it go to your head."
```

## How Scoring Works

You start at 10. Each category of issue found deducts 1 point. The final score determines which Gordon Ramsay quote you receive — ranging from genuine praise to absolute destruction.

## Development

```bash
git clone <repo>
cd roast-my-site
npm install
npm run build
node dist/cli.js https://example.com
```

## Stack

- TypeScript + tsup
- Commander (CLI parsing)
- Cheerio (HTML parsing)
- Chalk (terminal colors)
- Ora (spinners)

## Author

Carson Roell

## License

MIT
