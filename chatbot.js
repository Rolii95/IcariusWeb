(function () {
  const sanitize = (value) =>
    String(value || "")
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .replace(/[<>]/g, "");

  const cannedResponses = {
    overview:
      "Icarius Consulting helps growth-minded companies build marketing systems that align brand, content, and go-to-market execution.",
    services:
      "We support strategy sprints, messaging playbooks, RevOps advisory, and enablement to keep revenue teams in sync.",
    process:
      "Kick off with a discovery call, partner on focused roadmaps, then iterate with measurable experiments and continuous feedback.",
  };

  const togglePanel = (panel, toggles, expanded) => {
    if (!panel) return;
    const isOpen = expanded ?? !panel.classList.contains("open");
    panel.classList.toggle("open", isOpen);
    panel.toggleAttribute("hidden", !isOpen);
    toggles.forEach((btn) => btn.setAttribute("aria-expanded", String(isOpen)));
    if (isOpen) {
      panel.querySelector("input, textarea")?.focus({ preventScroll: true });
    } else {
      toggles[0]?.focus({ preventScroll: true });
    }
  };

  const appendMessage = (container, text, author) => {
    if (!container) return;
    const message = document.createElement("div");
    message.className = `chatbot-message ${author}`;
    message.textContent = text;
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
  };

  const resetForm = (form) => {
    form.reset();
    const firstInput = form.querySelector("input, textarea");
    firstInput?.focus({ preventScroll: true });
  };

  document.addEventListener("DOMContentLoaded", () => {
    const panel = document.querySelector(".chatbot-panel");
    const toggles = Array.from(document.querySelectorAll(".chatbot-toggle"));
    if (!panel || toggles.length === 0) return;

    const closeButton = panel.querySelector("[data-chatbot-close]");
    const messages = panel.querySelector("[data-chatbot-messages]");
    const quickReplyButtons = panel.querySelectorAll("[data-chatbot-reply]");
    const form = panel.querySelector("form");
    const status = panel.querySelector("[data-chatbot-status]");
    const spinner = panel.querySelector("[data-chatbot-spinner]");

    toggles.forEach((toggle) => {
      toggle.addEventListener("click", () => togglePanel(panel, toggles));
    });

    closeButton?.addEventListener("click", () => togglePanel(panel, toggles, false));

    appendMessage(
      messages,
      "Hi there! I’m the Icarius assistant. Ask me about our services or leave a note and we’ll follow up.",
      "bot"
    );

    quickReplyButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.getAttribute("data-chatbot-reply");
        const response = cannedResponses[key];
        if (!response) return;
        appendMessage(messages, button.textContent.trim(), "user");
        window.setTimeout(() => {
          appendMessage(messages, response, "bot");
        }, 300);
      });
    });

    const setStatus = (message, tone = "") => {
      if (!status) return;
      status.textContent = message;
      status.classList.remove("error", "success");
      if (tone) status.classList.add(tone);
    };

    const setSubmitting = (submitting) => {
      if (!form) return;
      Array.from(form.elements).forEach((element) => {
        if ("disabled" in element) {
          element.disabled = submitting;
        }
      });
      if (spinner) {
        spinner.classList.toggle("visible", submitting);
      }
    };

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form) return;

      const formData = new FormData(form);
      const name = sanitize(formData.get("name"));
      const email = sanitize(formData.get("email"));
      const company = sanitize(formData.get("company"));
      const message = sanitize(formData.get("message"));

      const errors = [];
      if (!name) errors.push("Please share your name.");
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) errors.push("Enter a valid email address.");
      if (!message || message.length < 10) errors.push("Tell us a bit more so we can help.");

      if (errors.length) {
        setStatus(errors.join(" "), "error");
        return;
      }

      setStatus("Sending your note...");
      setSubmitting(true);

      try {
        const response = await fetch("/api/save-chat-request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, company, message }),
          credentials: "same-origin",
        });

        const payload = await response.json().catch(() => ({ success: false }));
        if (!response.ok || !payload.success) {
          const detail = payload.error || "We couldn’t send that. Please try again.";
          throw new Error(detail);
        }

        appendMessage(
          messages,
          "Thanks for reaching out! A consultant will respond soon via email.",
          "bot"
        );
        setStatus("Message sent successfully.", "success");
        resetForm(form);
      } catch (error) {
        console.error("Chatbot submission failed", error);
        setStatus(error.message || "We couldn’t send that. Please try again.", "error");
      } finally {
        setSubmitting(false);
      }
    });
  });
})();
