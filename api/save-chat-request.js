const { promises: fs } = require("fs");
const path = require("path");

const respond = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
};

const sanitize = (value) =>
  String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .trim();

const validatePayload = ({ name, email, company, message }) => {
  const errors = [];
  if (!name) errors.push("Name is required.");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) errors.push("A valid email is required.");
  if (!message || message.length < 10) errors.push("Message should include at least 10 characters.");
  if (company.length > 120) errors.push("Company name is too long.");
  return errors;
};

const persistRequest = async (entry) => {
  const directory = path.join("/tmp", "chatbot");
  const filePath = path.join(directory, "requests.json");
  await fs.mkdir(directory, { recursive: true });

  try {
    const file = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(file);
    parsed.push(entry);
    await fs.writeFile(filePath, JSON.stringify(parsed, null, 2), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.writeFile(filePath, JSON.stringify([entry], null, 2), "utf8");
    } else {
      throw error;
    }
  }
};

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
    return respond(res, 405, { success: false, error: "Method not allowed." });
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks).toString("utf8");
    let parsedBody = {};
    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch (error) {
        return respond(res, 400, { success: false, error: "Invalid JSON payload." });
      }
    }

    const payload = {
      name: sanitize(parsedBody.name),
      email: sanitize(parsedBody.email),
      company: sanitize(parsedBody.company),
      message: sanitize(parsedBody.message),
      submittedAt: new Date().toISOString(),
      source: sanitize(req.headers["referer"]) || "website",
      ip: sanitize(req.headers["x-forwarded-for"] || req.socket.remoteAddress || ""),
    };

    const errors = validatePayload(payload);
    if (errors.length) {
      return respond(res, 400, { success: false, error: errors.join(" ") });
    }

    await persistRequest(payload);

    return respond(res, 200, { success: true });
  } catch (error) {
    console.error("Chatbot request failed", error);
    return respond(res, 500, { success: false, error: "Unable to save request." });
  }
};
