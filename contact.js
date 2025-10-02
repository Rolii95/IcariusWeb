import {
  sanitize,
  submitContactRequest,
  validateContactFields,
} from "./components/contact-request.js";

document.getElementById("year")?.textContent = new Date().getFullYear();

const form = document.getElementById("contact-form");
const statusMessage = document.getElementById("status-message");
const submitButton = form?.querySelector('button[type="submit"]');
const baseStatusClass = statusMessage?.className || "";

const setStatus = (message, tone) => {
  if (!statusMessage) return;
  statusMessage.textContent = message;
  const classes = [baseStatusClass];
  if (tone) classes.push(tone);
  statusMessage.className = classes.filter(Boolean).join(" ");
};

const clearStatus = () => setStatus("", "");

const setSubmitting = (submitting) => {
  if (!submitButton) return;
  submitButton.disabled = submitting;
};

const fieldNames = ["name", "email", "message"];

const toggleFieldError = (fieldName, hasError) => {
  if (!form) return;
  const fieldWrapper = form.querySelector(`[data-field="${fieldName}"]`);
  fieldWrapper?.classList.toggle("error", Boolean(hasError));
};

const showFieldErrors = (errors) => {
  fieldNames.forEach((field) => {
    toggleFieldError(field, errors[field]);
  });
};

if (form) {
  form.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const fieldName = target.getAttribute("name");
    if (!fieldName || !fieldNames.includes(fieldName)) return;
    toggleFieldError(fieldName, false);
    clearStatus();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearStatus();

    const formData = new FormData(form);
    const payload = {
      name: sanitize(formData.get("name")),
      email: sanitize(formData.get("email")),
      message: sanitize(formData.get("message")),
      company: sanitize(formData.get("company")),
      source: "contact-page",
    };

    const errors = validateContactFields(payload, {
      messages: {
        name: "Please tell us your name.",
        email: "Enter a valid work email address.",
        message: "Please share a little about your needs.",
      },
    });

    showFieldErrors(errors);

    if (Object.keys(errors).length) {
      setStatus("Please correct the highlighted fields.", "error");
      return;
    }

    setStatus("Sending…");
    setSubmitting(true);

    try {
      await submitContactRequest(payload);
      setStatus("Thanks! We'll be in touch shortly.", "success");
      form.reset();
      fieldNames.forEach((field) => toggleFieldError(field, false));
    } catch (error) {
      console.error("Contact form submission failed", error);
      setStatus(error.message || "We couldn't send your message. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  });
}
