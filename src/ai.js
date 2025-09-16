const OpenAI = require("openai");
const { PROFILE, OPENAI_CONFIG } = require("./config");


// Use OpenRouter endpoint
const client = new OpenAI({
apiKey: process.env.OPENROUTER_KEY,
baseURL: "https://openrouter.ai/api/v1"
});


/**
* Generate a subject + body for a pitch/application email.
* @param {Object} opts
* @param {String} opts.intent - "pitch" | "apply"
* @param {String} opts.recipient - recipient email or org/person name (for tone)
* @param {String} opts.role - role title (e.g., Frontend Developer)
* @param {String} opts.jobDesc - pasted JD or summary
* @param {String} opts.extra - any extra instructions
*/
async function generateEmail({ intent, recipient, role, jobDesc, extra }) {
console.log(`[ai] 🚀 Starting email generation for ${recipient}`);
console.log(`[ai] 📋 Input: intent=${intent}, role=${role}, jobDesc=${jobDesc?.substring(0, 50)}..., extra=${extra}`);

const system = `You are an assistant that writes concise, high-conversion emails. Use plain text. British/International English. Avoid flowery language. 130-220 words. Include 3-5 bullet points only when helpful. Include portfolio links if provided.`;

const profileBlock = `Candidate: ${PROFILE.name} | ${PROFILE.title}\nLocation: ${PROFILE.location}\nLinks: ${PROFILE.links}`;

let user;
if (intent === 'pitch') {
  // For pitch emails, we're pitching OUR services TO the recipient
  user = [
    `INTENT: ${intent}`,
    `RECIPIENT: ${recipient || "Unknown"}`,
    `ROLE: ${role || "Not specified"}`,
    `JOB DESCRIPTION:`,
    jobDesc || "(none provided)",
    extra ? `EXTRA: ${extra}` : "",
    `\nWrite a professional pitch email FROM Reagan Otieno TO the RECIPIENT offering web/app development services. ` +
    `This is a cold pitch for business opportunities. ` +
    `Use Reagan's portfolio, GitHub, and LinkedIn as credentials. ` +
    `End with Reagan's contact details: Reagan Otieno, Software Engineer, tel +254740489555. ` +
    `Make it sound like Reagan is reaching out to offer services, not the other way around.`,
    `\n${profileBlock}`
  ].join("\n");
} else {
  // For apply emails, we're applying TO the recipient
  user = [
    `INTENT: ${intent}`,
    `RECIPIENT: ${recipient || "Unknown"}`,
    `ROLE: ${role || "Not specified"}`,
    `JOB DESCRIPTION:`,
    jobDesc || "(none provided)",
    extra ? `EXTRA: ${extra}` : "",
    `\nWrite a short, tailored email suitable for sending to the RECIPIENT. ` +
    `If intent is 'apply', treat as formal cover-letter style. ` +
    `Use the candidate block below. End with a polite CTA.`,
    `\n${profileBlock}`
  ].join("\n");
}

console.log(`[ai] 🤖 Making API call to ${OPENAI_CONFIG.model}...`);
const resp = await client.chat.completions.create({
model: OPENAI_CONFIG.model,
messages: [
{ role: "system", content: system },
{ role: "user", content: user }
],
temperature: 0.6
});

console.log(`[ai] ✅ API response received`);
const text = resp.choices?.[0]?.message?.content?.trim() || "";
console.log(`[ai] 📝 Raw response length: ${text.length} characters`);

// Simple parse: first line as Subject if present like "Subject: ..."
let subject;
if (intent === 'pitch') {
  subject = `Web & App Development Services - ${role || "Partnership Opportunity"}`;
} else {
  subject = `Application: ${role || "Opportunity"}`;
}

let body = text;
const subjectMatch = text.match(/^\s*Subject\s*:\s*(.+)$/im);
if (subjectMatch) {
subject = subjectMatch[1].trim();
body = text.replace(subjectMatch[0], "").trim();
console.log(`[ai] 📧 Extracted subject from response: ${subject}`);
} else {
console.log(`[ai] 📧 Using default subject: ${subject}`);
}

console.log(`[ai] 🎉 Email generation completed - Subject: "${subject}", Body: ${body.length} chars`);
return { subject, body };
}


module.exports = { generateEmail };