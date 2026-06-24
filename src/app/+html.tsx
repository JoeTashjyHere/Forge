import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Root HTML document for the web build (single-page output). Sets the page
 * title and social/meta tags shown when Forge is shared or indexed. This file
 * only affects web and is not used on native.
 */
export default function Root({ children }: PropsWithChildren) {
  const title = 'Forge — Build What Won’t Build Itself';
  const description =
    'Forge helps ambitious people turn ideas into real projects with an AI coach, the right teammates, and a clear path from first step to launch.';

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#208AEF" />

        <title>{title}</title>
        <meta name="description" content={description} />

        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: backgroundReset }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

// Keeps the body background consistent with the app while fonts/JS load,
// avoiding a white flash in dark mode on web.
const backgroundReset = `
body { background-color: #fff; }
@media (prefers-color-scheme: dark) { body { background-color: #0B1120; } }
`;
