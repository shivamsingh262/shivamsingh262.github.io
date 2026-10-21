// Tells search engines that use IndexNow (Bing, Yandex, Seznam, Naver and
// others) which pages changed, so they recrawl them without waiting.
//
//   node src/indexnow.mjs                  print the request body for pages whose
//                                          lastmod differs from the live sitemap
//   node src/indexnow.mjs --all --submit   submit every page in the sitemap
//
// The deploy workflow runs the first form before deploying (so the live
// sitemap is still the old one) and submits the body once the site is live,
// since search engines check the key file on the site itself. The build writes
// that key file as dist/<key>.txt.

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ENDPOINT = 'https://api.indexnow.org/indexnow';

// { url: lastmod } from a sitemap.xml written by build.mjs.
const parse = (xml) => Object.fromEntries([...xml.matchAll(/<loc>(.*?)<\/loc><lastmod>(.*?)<\/lastmod>/g)].map((m) => [m[1], m[2]]));

async function liveSitemap(config) {
  const res = await fetch(`${config.url}/sitemap.xml`);
  if (res.status === 404) return {};
  if (!res.ok) throw new Error(`live sitemap returned ${res.status}`);
  return parse(await res.text());
}

async function main() {
  const args = process.argv.slice(2);
  const config = JSON.parse(await fs.readFile(path.join(ROOT, 'site.config.json'), 'utf8'));
  const built = parse(await fs.readFile(path.join(ROOT, 'dist', 'sitemap.xml'), 'utf8'));

  let urls = Object.keys(built);
  if (!args.includes('--all')) {
    const live = await liveSitemap(config);
    urls = urls.filter((u) => live[u] !== built[u]);
  }
  if (!urls.length) {
    console.error('IndexNow: no changed pages');
    return;
  }

  const body = JSON.stringify({
    host: new URL(config.url).host,
    key: config.indexNowKey,
    keyLocation: `${config.url}/${config.indexNowKey}.txt`,
    urlList: urls,
  });
  if (!args.includes('--submit')) {
    console.log(body);
    return;
  }
  const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body });
  // 200 and 202 both mean accepted; 202 is returned while the key is still being checked.
  if (!res.ok) throw new Error(`IndexNow returned ${res.status}: ${await res.text()}`);
  console.error(`IndexNow: submitted ${urls.length} URLs (${res.status})`);
}

main().catch((err) => {
  console.error(`IndexNow: ${err.message}`);
  process.exitCode = 1;
});
