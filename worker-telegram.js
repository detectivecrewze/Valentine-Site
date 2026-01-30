// src/index.js
var index_default = {
    async fetch(request, env) {
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        };

        // Handle CORS Preflight
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: corsHeaders
            });
        }

        const url = new URL(request.url);

        // ============================================================
        // ROUTE 1: FILE UPLOAD (Existing Logic)
        // ============================================================
        if (request.method === "POST" && url.pathname === "/upload") {
            try {
                const formData = await request.formData();
                const file = formData.get("file");
                if (!file) {
                    return new Response(JSON.stringify({
                        error: "No file provided"
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }
                if (file.size > 100 * 1024 * 1024) {
                    return new Response(JSON.stringify({
                        error: "File too large. Maximum 100MB."
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    });
                }
                const timestamp = Date.now();
                const randomStr = Math.random().toString(36).substring(7);
                const ext = file.name.split(".").pop().toLowerCase();
                const filename = `${timestamp}-${randomStr}.${ext}`;
                console.log(`Uploading file: ${filename} (${file.size} bytes)`);
                await env.BUCKET.put(filename, file.stream(), {
                    httpMetadata: {
                        contentType: file.type || "application/octet-stream"
                    }
                });
                const publicUrl = `${url.origin}/${filename}`;
                console.log(`Upload success: ${publicUrl}`);
                return new Response(JSON.stringify({
                    success: true,
                    url: publicUrl,
                    filename,
                    size: file.size
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            } catch (error) {
                console.error("Upload error:", error);
                return new Response(JSON.stringify({
                    error: error.message || "Upload failed"
                }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
        }

        // ============================================================
        // ROUTE 2: TELEGRAM FORWARDER (New Logic)
        // ============================================================
        if (request.method === "POST" && url.pathname === "/telegram") {
            return await handleTelegramSubmit(request, env, corsHeaders);
        }

        // ============================================================
        // ROUTE 3: FILE RETRIEVAL (Existing Logic)
        // ============================================================
        if (request.method === "GET" && url.pathname !== "/") {
            const filename = url.pathname.substring(1);
            console.log(`Fetching file: ${filename}`);
            try {
                const object = await env.BUCKET.get(filename);
                if (!object) {
                    return new Response("File not found", {
                        status: 404,
                        headers: corsHeaders
                    });
                }
                const headers = new Headers();
                object.writeHttpMetadata(headers);
                headers.set("etag", object.httpEtag);
                headers.set("Cache-Control", "public, max-age=31536000");
                for (const [key, value] of Object.entries(corsHeaders)) {
                    headers.set(key, value);
                }
                return new Response(object.body, { headers });
            } catch (error) {
                console.error("Download error:", error);
                return new Response("Error fetching file", {
                    status: 500,
                    headers: corsHeaders
                });
            }
        }

        // ============================================================
        // DEFAULT: LANDING PAGE
        // ============================================================
        return new Response(`
      <html>
        <head>
          <title>Valentine Backend API</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; line-height: 1.6; }
            h1 { color: #e91e63; }
            code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
            .status { background: #4caf50; color: white; padding: 10px; border-radius: 5px; text-align: center; }
            .badge { background: #2196f3; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; vertical-align: middle; }
          </style>
        </head>
        <body>
          <h1>💖 Valentine Backend API</h1>
          <div class="status">✅ API is running!</div>
          
          <h2>Endpoints:</h2>
          <ul>
            <li><code>POST /upload</code> - Upload file (R2)</li>
            <li><code>POST /telegram</code> <span class="badge">NEW</span> - Secure Telegram Forwarder</li>
            <li><code>GET /{filename}</code> - Download file</li>
          </ul>
        </body>
      </html>
    `, {
            headers: {
                "Content-Type": "text/html",
                ...corsHeaders
            }
        });
    }
};

/**
 * Helper to handle Telegram Submission
 */
async function handleTelegramSubmit(request, env, corsHeaders) {
    try {
        const formData = await request.formData();
        const file = formData.get('document');
        const caption = formData.get('caption');

        // Get secrets from Cloudflare Environment Variables
        const chatId = env.TELEGRAM_CHAT_ID;
        const botToken = env.TELEGRAM_BOT_TOKEN;

        if (!chatId || !botToken) {
            throw new Error("Server Misconfiguration: Missing TELEGRAM_CHAT_ID or TELEGRAM_BOT_TOKEN");
        }

        // Forward to Telegram
        const telegramFormData = new FormData();
        telegramFormData.append('chat_id', chatId);
        telegramFormData.append('document', file);
        if (caption) telegramFormData.append('caption', caption);

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
            method: "POST",
            body: telegramFormData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.description || "Telegram API Error");
        }

        return new Response(JSON.stringify({ success: true, result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

export {
    index_default as default
};
