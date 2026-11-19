
const EMAIL_RE = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

const RULES = [
  ["Prize / reward language", /\b(prize|winner|won|reward|lottery|jackpot)\b/gi, 2],
  ["Financial lure", /\b(free cash|cash bonus|claim money|loan approved|earn money)\b/gi, 3],
  ["Urgency / pressure", /\b(urgent|act now|immediately|limited time|expires today|final warning)\b/gi, 2],
  ["Credential request", /\b(password|login details|verify your account|bank details|credit card|otp)\b/gi, 4],
  ["Promotional spam terms", /\b(free|guaranteed|100%|no risk|click here|congratulations)\b/gi, 1]
];

const count = (text, regex) => [...text.matchAll(regex)].length;

function runFSM(senderValid, score) {
  const transitions = [
    { from: "START", input: "EMAIL_RECEIVED", to: "REVIEW" }
  ];

  let finalState;

  if (!senderValid) {
    transitions.push({ from: "REVIEW", input: "INVALID_SENDER", to: "SPAM" });
    finalState = "SPAM";
  } else if (score >= 7) {
    transitions.push({ from: "REVIEW", input: "HIGH_RISK_PATTERN", to: "SPAM" });
    finalState = "SPAM";
  } else if (score >= 3) {
    transitions.push({ from: "REVIEW", input: "SUSPICIOUS_PATTERN", to: "SUSPICIOUS" });
    finalState = "SUSPICIOUS";
  } else {
    transitions.push({ from: "REVIEW", input: "NO_MAJOR_PATTERN", to: "SAFE" });
    finalState = "SAFE";
  }

  return { finalState, transitions };
}

export function analyzeEmail({ sender, subject, message }) {
  const text = `${subject}\n${message}`;
  const senderValid = EMAIL_RE.test(sender);

  const findings = [];
  let riskScore = 0;

  if (!senderValid) {
    findings.push({
      type: "Invalid sender",
      detail: "Sender address does not match the expected email format.",
      points: 5
    });
    riskScore += 5;
  }

  for (const [label, regex, weight] of RULES) {
    const matches = count(text, regex);

    if (matches > 0) {
      const points = matches * weight;
      riskScore += points;

      findings.push({
        type: label,
        detail: `${matches} matching occurrence(s) detected.`,
        points
      });
    }
  }

  // Detect external links
  const links = text.match(/https?:\/\/[^\s<>"']+/gi) || [];

  if (links.length > 0) {
    const points = Math.min(links.length * 2, 6);
    riskScore += points;

    findings.push({
      type: "External link",
      detail: `${links.length} link(s) found in the email.`,
      points
    });
  }

  // Detect abnormal punctuation
  if (/[!?]{3,}/.test(text)) {
    riskScore += 1;

    findings.push({
      type: "Abnormal punctuation sequence",
      detail: "Three or more consecutive ! or ? marks found.",
      points: 1
    });
  }

  // Detect repeated words
  if (/\b(\w{3,})(?:\s+\1){2,}\b/i.test(text)) {
    riskScore += 2;

    findings.push({
      type: "Repeated word sequence",
      detail: "The same word appears repeatedly in sequence.",
      points: 2
    });
  }

  const fsm = runFSM(senderValid, riskScore);
  const classification = fsm.finalState;

  const explanation =
    classification === "SAFE"
      ? "No major suspicious patterns were detected by the configured rules."
      : classification === "SUSPICIOUS"
      ? "Suspicious patterns were detected. Review the findings before trusting this email."
      : "High-risk signals or an invalid sender were detected. Treat this email as spam.";

  return {
    sender,
    subject,
    senderValid,
    classification,
    riskScore: Math.min(riskScore, 100),
    findings,
    fsm,
    explanation
  };
}
