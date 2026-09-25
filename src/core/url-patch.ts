import url from 'node:url';

// Suppress DEP0169 DeprecationWarning for legacy url.parse()
const originalEmitWarning = process.emitWarning;
process.emitWarning = function (warning: any, ...args: any[]) {
  if (
    warning === 'DEP0169' ||
    (typeof warning === 'string' && (warning.includes('DEP0169') || warning.includes('url.parse()'))) ||
    (args[0] === 'DEP0169' || (typeof args[0] === 'string' && args[0].includes('DEP0169'))) ||
    (args[1] === 'DEP0169')
  ) {
    return;
  }
  return (originalEmitWarning as any).apply(process, [warning, ...args]);
};

// Patch url.parse to use WHATWG URL API internally to prevent warning generation
if (typeof url.parse === 'function') {
  const originalParse = url.parse;
  url.parse = function (urlStr: string, parseQueryString?: boolean, slashesDenoteHost?: boolean): any {
    if (!urlStr || typeof urlStr !== 'string') {
      return (originalParse as any).apply(this, arguments);
    }
    try {
      const isRelative = !urlStr.startsWith('http://') && !urlStr.startsWith('https://') && !urlStr.startsWith('//');
      const parsed = new URL(urlStr, 'http://localhost');
      const pathname = parsed.pathname;
      const search = parsed.search || null;
      const path = pathname + (parsed.search || '');

      if (isRelative) {
        return {
          protocol: null,
          slashes: null,
          auth: null,
          host: null,
          port: null,
          hostname: null,
          hash: parsed.hash || null,
          search: search,
          query: parseQueryString ? Object.fromEntries(parsed.searchParams) : (search ? search.slice(1) : null),
          pathname: pathname,
          path: path,
          href: path + (parsed.hash || ''),
        };
      }

      return {
        protocol: parsed.protocol,
        slashes: true,
        auth: parsed.username ? parsed.username + (parsed.password ? ':' + parsed.password : '') : null,
        host: parsed.host,
        port: parsed.port || null,
        hostname: parsed.hostname,
        hash: parsed.hash || null,
        search: search,
        query: parseQueryString ? Object.fromEntries(parsed.searchParams) : (search ? search.slice(1) : null),
        pathname: pathname,
        path: path,
        href: parsed.href,
      };
    } catch {
      return (originalParse as any).apply(this, arguments);
    }
  };
}
