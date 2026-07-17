import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
};

const port = Number(option("--port", "4334"));
const backend = new URL(option("--backend", "http://127.0.0.1:4333"));
const root = path.resolve("out");
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

if (!fs.existsSync(path.join(root, "index.html"))) {
  throw new Error("Missing out/index.html; run `rm -rf .next out && npm run build` first");
}

const findStaticFile = (pathname) => {
  let relativePath = null;
  if (pathname.startsWith("/litellm-asset-prefix/")) {
    relativePath = pathname.slice("/litellm-asset-prefix/".length);
  } else if (pathname === "/ui" || pathname === "/ui/") {
    relativePath = "index.html";
  } else if (pathname.startsWith("/ui/")) {
    relativePath = pathname.slice(4);
  } else if (pathname.startsWith("/_next/") || pathname === "/favicon.ico") {
    relativePath = pathname.slice(1);
  }

  if (relativePath === null) return null;
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  let candidate = path.join(root, normalized);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    candidate = path.join(candidate, "index.html");
  } else if (!path.extname(candidate) && fs.existsSync(`${candidate}.html`)) {
    candidate = `${candidate}.html`;
  }
  return candidate.startsWith(root) && fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : null;
};

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://clean-runtime").pathname);
  const file = request.method === "GET" || request.method === "HEAD" ? findStaticFile(pathname) : null;

  if (file) {
    response.statusCode = 200;
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Type", contentTypes[path.extname(file)] ?? "application/octet-stream");
    response.setHeader("X-Clean-Runtime", "mg-b1-fix2");
    if (request.method === "HEAD") return response.end();
    return fs.createReadStream(file).pipe(response);
  }

  const upstream = http.request(
    {
      hostname: backend.hostname,
      port: backend.port,
      method: request.method,
      path: request.url,
      headers: { ...request.headers, host: backend.host },
    },
    (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode ?? 502, {
        ...upstreamResponse.headers,
        "x-clean-runtime": "mg-b1-fix2-proxy",
      });
      upstreamResponse.pipe(response);
    },
  );
  upstream.on("error", (error) => {
    response.statusCode = 502;
    response.end(error.message);
  });
  request.pipe(upstream);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`CLEAN_RUNTIME http://127.0.0.1:${port}/ui/ -> ${root}; API -> ${backend.origin}`);
});
