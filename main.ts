const TARGET = "https://coomer.st";

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  const targetPath = url.searchParams.get("url");
  if (!targetPath) {
    return new Response("Missing ?url= parameter", { status: 400 });
  }

  const targetUrl = targetPath.startsWith("http")
    ? targetPath
    : `${TARGET}${targetPath}`;

  // Dosya istekleri için farklı CDN host'larını dene
  const isFile = !targetPath.includes("/api/");
  const hosts = isFile
    ? ["https://coomer.st", "https://c1.coomer.st", "https://c2.coomer.st", "https://c3.coomer.st"]
    : [TARGET];

  let lastErr = "";

  for (const host of hosts) {
    const tryUrl = isFile && !targetPath.startsWith("http")
      ? `${host}${targetPath}`
      : targetUrl;

    try {
      const resp = await fetch(tryUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "text/css",
          "Referer": "https://coomer.st/",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
        },
      });

      if (resp.ok) {
        const body = await resp.arrayBuffer();
        return new Response(body, {
          status: resp.status,
          headers: {
            "Content-Type": resp.headers.get("Content-Type") || "application/octet-stream",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
      lastErr = `${host} -> HTTP ${resp.status}`;
    } catch (e) {
      lastErr = `${host} -> ${(e as Error).message}`;
      console.error("Fetch error:", tryUrl, (e as Error).message);
    }
  }

  return new Response(`All hosts failed. Last error: ${lastErr}`, {
    status: 502,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
});
