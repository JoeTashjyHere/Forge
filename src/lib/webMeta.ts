/**
 * Sets the document title and SEO/social meta tags for the web build.
 *
 * The app ships as a single-page web output, where Expo's generated index.html
 * only contains the app name as the title. Because static `+html.tsx` is not
 * applied to single-page output, we set the metadata at runtime instead so the
 * browser tab, search crawlers that run JS, and link unfurls show real copy.
 */
const TITLE = 'Forge — Build What Won’t Build Itself';
const DESCRIPTION =
  'Forge helps ambitious people turn ideas into real projects with an AI coach, the right teammates, and a clear path from first step to launch.';

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function applyWebMeta() {
  if (typeof document === 'undefined') return;
  document.title = TITLE;
  setMeta('meta[name="description"]', 'name', 'description', DESCRIPTION);
  setMeta('meta[name="theme-color"]', 'name', 'theme-color', '#208AEF');
  setMeta('meta[property="og:title"]', 'property', 'og:title', TITLE);
  setMeta('meta[property="og:description"]', 'property', 'og:description', DESCRIPTION);
  setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
  setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary');
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', TITLE);
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', DESCRIPTION);
}
