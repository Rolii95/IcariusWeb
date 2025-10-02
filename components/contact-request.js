const emailPattern = /[^@\s]+@[^@\s]+\.[^@\s]+/;

export const sanitize = (value) =>
  String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .trim();

export const validateContactFields = (
  data,
  {
    messages = {},
    minMessageLength = 10,
  } = {}
) => {
  const defaults = {
    name: "Please share your name.",
    email: "Enter a valid email address.",
    message:
      minMessageLength > 1
        ? `Please share at least ${minMessageLength} characters.`
        : "Please share a short message.",
  };

  const errors = {};
  if (!sanitize(data.name)) {
    errors.name = messages.name || defaults.name;
  }

  const email = sanitize(data.email);
  if (!emailPattern.test(email)) {
    errors.email = messages.email || defaults.email;
  }

  const message = sanitize(data.message);
  if (!message || message.length < minMessageLength) {
    errors.message = messages.message || defaults.message;
  }

  return errors;
};

export const submitContactRequest = async (payload) => {
  const preparedPayload = Object.entries(payload || {}).reduce(
    (accumulator, [key, value]) => {
      accumulator[key] = sanitize(value);
      return accumulator;
    },
    {},
  );

  const response = await fetch("/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(preparedPayload),
    credentials: "same-origin",
  });

  let body = {};
  try {
    body = await response.json();
  } catch (error) {
    body = {};
  }

  if (!response.ok || !body?.ok) {
    const message = body?.error || "We couldn't send your message. Please try again.";
    throw new Error(message);
  }

  return body;
};
