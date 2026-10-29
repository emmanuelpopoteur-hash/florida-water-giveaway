# Legacy Water USA — Virtual Sales Advisor

## Current deployment mode
- Guided bilingual (ES/EN) sales advisor works entirely in the browser, at any hour, without an AI API key.
- Visible as a floating widget on the homepage, systems catalog, RO inquiry page, free water test, and Colombia pilot pages.
- Answers are curated: drinking RO, whole-home, well water, city water, UV, maintenance, pricing, warranty, H2 status, bottled water, and human escalation.
- Spanish is fixed on the Colombia pilot pages. **No U.S. prices are quoted for Colombia**.
- Users can request a callback inside the widget. Florida water-test requests go to `/api/leads`, US RO inquiries to `/api/ro-inquiries`. No orders, checkout, payments, or appointment slots are created.
- Lead contact details are validated in the existing Cloudflare Pages Functions, stored in D1, and sent to the existing notification email. Chat transcripts are not sent to D1.
- RO lead campaign labels include `virtual-advisor` to compare performance against forms on the RO page.
- Widget assets: `/chatbot/assistant.css` and `/chatbot/assistant.js`. Build script must copy `chatbot` to `dist`.

## Optional conversational AI (OFF by default)
The server-side endpoint `/api/sales-chat` supports OpenAI Responses API via Cloudflare Pages Functions. **Do not put an API key inside browser JavaScript or GitHub.**

Before enabling AI:
1. Configure a Cloudflare KV namespace and bind it to the production Pages environment as `CHATBOT_RATE_LIMIT`.
2. In Cloudflare Workers & Pages > production project > Settings > Variables and Secrets, add an **encrypted secret** `OPENAI_API_KEY`.
3. Add `CHATBOT_AI_ENABLED=true` as a production variable, then redeploy. Optionally set `CHATBOT_AI_MODEL` to a supported, cost-controlled model.
4. Configure Cloudflare WAF/rate limiting or equivalent abuse protections for `/api/sales-chat` before exposing AI to significant traffic.
5. Verify the GET endpoint returns `{"enabled":true}` when correctly configured. Without all requirements, it returns `{"enabled":false}` and the guided sales advisor remains available.
6. Test the AI answers for U.S. vs Colombia prices, customer warranty, UV limits, and H2 disclaimers. Review costs and API usage regularly.

## Acceptance testing (live)
- Open homepage on iPhone, open floating chatbot. Verify welcome, quick replies, and Spanish/English selection.
- From RO, ask “What is the price?” and “Can it make pH 10.5?” Confirm the proposed $1,199 price and absence of unverified H2 claims.
- From Colombia page, ask for price. Confirm no U.S. price is shown.
- Request a callback with test contact details only with the owner's authorization. Verify success reference, D1 record, and Resend delivery. In CRM check campaign tag `virtual-advisor`.
- Check mobile keyboard, close behavior, external links and both language versions.
- Do not test payment processing; the widget never collects cards.

## Limitations
The guided mode recognizes common keywords and fixed sales topics, not arbitrary questions with general AI reasoning. Configuring the optional server-side AI service is required for open-ended generative conversations. Never advertise live human agents 24/7.
