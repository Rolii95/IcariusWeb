const respond = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
};

const sanitize = (value) =>
  String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return respond(res, 405, { ok: false, error: "Method not allowed." });
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks).toString("utf8");

    if (!rawBody) {
      return respond(res, 400, { ok: false, error: "Missing request body." });
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch (error) {
      return respond(res, 400, { ok: false, error: "Invalid JSON payload." });
    }

    const payload = {
      name: sanitize(parsedBody.name),
      email: sanitize(parsedBody.email),
      message: sanitize(parsedBody.message),
      company: sanitize(parsedBody.company),
      source: sanitize(parsedBody.source || req.headers["referer"] || ""),
    };

    if (!payload.name) {
      return respond(res, 400, { ok: false, error: "Name is required." });
    }

    if (!isValidEmail(payload.email)) {
      return respond(res, 400, { ok: false, error: "A valid email address is required." });
    }

    if (!payload.message) {
      return respond(res, 400, { ok: false, error: "Message is required." });
    }

    const webhookUrl = process.env.CONTACT_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: payload.name,
            email: payload.email,
            message: payload.message,
            company: payload.company,
            source: payload.source,
            submittedAt: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          throw new Error(detail || `Webhook request failed with status ${response.status}.`);
        }
      } catch (error) {
        console.error("Contact webhook request failed", error);
        return respond(res, 502, {
          ok: false,
          error: "Unable to deliver the message.",
        });
      }
    }

    return respond(res, 200, { ok: true });
  } catch (error) {
    console.error("Contact form handler failed", error);
    return respond(res, 500, {
      ok: false,
      error: "Unexpected error while submitting the form.",
    });
  }
};
