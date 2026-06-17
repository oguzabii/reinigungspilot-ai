/**
 * Ask Office — local (deterministic) chat engine (vNext).
 *
 * The fallback "brain" behind Ask Office when no external AI provider is
 * configured. It is PURE and LOCAL: no API, no I/O, no secrets — client- and
 * server-safe. It is the honest baseline; when a provider IS configured,
 * `ask-office-chat.ts` uses it for the conversational text and keeps this engine
 * for the structured, approval-required action proposals.
 *
 * It is deliberately NOT a fixed FAQ: it detects intent + language, acknowledges
 * the user's actual message, and weaves in the real, tenant-scoped office
 * context (setup gaps, worker state, mailbox/template/pricing status, package
 * limits, pending approvals/tasks).
 *
 * Language: opens in German; each reply follows the language the user wrote in
 * (German / Turkish / English). Unclear → German (Swiss default). Business
 * object names are not translated.
 */

import { formatNumber } from "@/lib/format";
import type { AskOfficeContext } from "./ask-office-context";

export type AskLang = "de" | "tr" | "en";

export type ProposalKind =
  | "pricing_change"
  | "send_email"
  | "task"
  | "followup"
  | "template"
  | "generic";

export interface AskOfficeProposal {
  kind: ProposalKind;
  /** Short summary of what WOULD happen (in the user's language). */
  summary: string;
  requiresConfirmation: true;
}

export interface AskOfficeReply {
  lang: AskLang;
  text: string;
  proposal?: AskOfficeProposal;
  /** Follow-up suggestion chips in the same language. */
  suggestions?: string[];
  /** Localized labels of the context facets the answer drew on. */
  contextUsed?: string[];
}

/** One turn of chat history (role + content), used for light continuity. */
export interface AskTurn {
  role: "user" | "assistant";
  content: string;
}

/* -------------------------------------------------------------------------- */
/* Language detection                                                          */
/* -------------------------------------------------------------------------- */

const TR_WORDS =
  /\b(bug[uü]n|i[şs]ler|i[şs]|[oö]zetle|[oö]zet|g[oö]ster|haz[ıi]rla|neler|nas[ıi]l|fiyat|teklif|m[uü][şs]teri|m[uü][şs]teriler|i[çc]in|l[uü]tfen|a[çc]|yap|takip|hat[ıi]rlat|g[oö]nder|durum|paket|s[ıi]n[ıi]r|onay|g[oö]rev|ad[ıi]m|sonraki|eksik|kurulum|merhaba|nedir|ne)\b/i;
const TR_CHARS = /[ışğİ]/;

const EN_WORDS =
  /\b(the|my|show|summar(?:y|ize|ise)|today|what|how|please|create|draft|office|task|tasks|pending|approval|approvals|price|pricing|offer|template|send|email|next|step|steps|missing|setup|gap|gaps|limit|package|plan|hello|hi|before|launch)\b/i;

const DE_WORDS =
  /\b(der|die|das|und|ist|mein|meine|zeige|zeig|fasse|fass|zusammen|welche|heute|offen|offene|bereite|vor|aufgabe|aufgaben|freigabe|freigaben|was|soll|f[uü]r|mir|b[uü]ro|n[aä]chste|schritte|fehlt|einrichtung|preis|preise|offerte|vorlage|senden|sende|hallo|paket|limit|grenzen)\b/i;

/** Detect the language of a message. Unclear → German (Swiss default). */
export function detectLanguage(message: string): AskLang {
  const text = message.toLowerCase();
  let de = 0;
  let tr = 0;
  let en = 0;

  if (DE_WORDS.test(text)) de += 2;
  if (/[äß]/.test(text)) de += 1;
  if (TR_WORDS.test(text)) tr += 2;
  if (TR_CHARS.test(text)) tr += 2;
  if (EN_WORDS.test(text)) en += 2;

  if (tr >= de && tr > en && tr > 0) return "tr";
  if (en > de && en > tr) return "en";
  if (de > 0) return "de";
  if (tr > 0) return "tr";
  if (en > 0) return "en";
  return "de";
}

/* -------------------------------------------------------------------------- */
/* Static UI copy                                                             */
/* -------------------------------------------------------------------------- */

export function greeting(lang: AskLang): string {
  switch (lang) {
    case "tr":
      return "Merhaba, dijital büronuz sizin için ne yapsın?";
    case "en":
      return "Hello, what should your digital office do for you?";
    default:
      return "Hallo, was soll Ihr digitales Büro für Sie erledigen?";
  }
}

export function placeholder(lang: AskLang): string {
  switch (lang) {
    case "tr":
      return "Bir şey yazın…";
    case "en":
      return "Type a message…";
    default:
      return "Nachricht schreiben…";
  }
}

export function defaultSuggestions(lang: AskLang): string[] {
  switch (lang) {
    case "tr":
      return [
        "Dijital büromu özetle",
        "Bugün hangi işler önemli?",
        "Bekleyen onayları göster",
        "Bir teklif hazırla",
        "Hangi kurulum eksik?",
      ];
    case "en":
      return [
        "Summarize my digital office",
        "What tasks matter today?",
        "Show pending approvals",
        "Prepare an offer",
        "What setup is missing?",
      ];
    default:
      return [
        "Fasse mein digitales Büro zusammen",
        "Welche Aufgaben sind heute wichtig?",
        "Zeige offene Freigaben",
        "Bereite eine Offerte vor",
        "Welche Einrichtung fehlt noch?",
      ];
  }
}

/* -------------------------------------------------------------------------- */
/* Intent detection                                                            */
/* -------------------------------------------------------------------------- */

type Intent =
  | "summarize"
  | "setup_gaps"
  | "next_steps"
  | "pending_approvals"
  | "create_task"
  | "draft_followup"
  | "explain_limits"
  | "pricing_change"
  | "suggest_pricing"
  | "suggest_template"
  | "send_email"
  | "help";

const PRICING_RE =
  /(preis|preisregel|chf|rabatt|zuschlag|stundensatz|fiyat|[uü]cret|indirim|price|pricing|rate|discount)/i;
const SET_VERB =
  /\b(set|setze|setzen|auf|to|yap|yapar|olarak|=|[aä]ndere|change|update|kaydet)\b/i;
const HAS_NUMBER = /\d/;

function detectIntent(text: string): Intent {
  const t = text.toLowerCase();

  if (PRICING_RE.test(t) && HAS_NUMBER.test(t) && SET_VERB.test(t)) {
    return "pricing_change";
  }
  if (/(sende|senden|verschick|g[oö]nder|mail g[oö]nder|send|e-?mail)/i.test(t))
    return "send_email";
  if (/(freigabe|freigaben|genehmig|onay|approval|approvals|pending)/i.test(t))
    return "pending_approvals";
  if (/(follow-?up|nachfass|erinnerung|takip|hat[ıi]rlat|reminder)/i.test(t))
    return "draft_followup";
  if (/(aufgabe|task|g[oö]rev)/i.test(t)) return "create_task";
  if (/(vorlage|offerte|pdf|[şs]ablon|teklif|template|offer)/i.test(t))
    return "suggest_template";
  if (PRICING_RE.test(t)) return "suggest_pricing";
  if (/(paket|limit|grenzen|tarif|s[ıi]n[ıi]r|package|plan)/i.test(t))
    return "explain_limits";
  if (/(fehlt|einrichtung|l[uü]cke|eksik|kurulum|missing|setup|gap|before|launch)/i.test(t))
    return "setup_gaps";
  if (/(n[aä]chste|schritte|empfehl|sonraki|ad[ıi]m|[oö]ner|ne yapmal|next|step|recommend|what should)/i.test(t))
    return "next_steps";
  if (/(zusammen|[uü]berblick|fasse|status|[oö]zetle|[oö]zet|durum|summar|overview)/i.test(t))
    return "summarize";

  return "help";
}

/* -------------------------------------------------------------------------- */
/* Localisation helpers                                                        */
/* -------------------------------------------------------------------------- */

function joinList(items: string[], lang: AskLang): string {
  if (items.length === 0)
    return lang === "tr" ? "yok" : lang === "en" ? "none" : "keine";
  if (items.length === 1) return items[0];
  const last = lang === "tr" ? " ve " : lang === "en" ? " and " : " und ";
  return items.slice(0, -1).join(", ") + last + items[items.length - 1];
}

const MAILBOX_LABEL: Record<string, Record<AskLang, string>> = {
  not_connected: { de: "nicht verbunden", tr: "bağlı değil", en: "not connected" },
  configured: { de: "konfiguriert", tr: "yapılandırıldı", en: "configured" },
  connected: { de: "verbunden", tr: "bağlı", en: "connected" },
  error: { de: "Fehler", tr: "hata", en: "error" },
};

const FACET: Record<string, Record<AskLang, string>> = {
  setup: { de: "Einrichtung", tr: "Kurulum", en: "Setup" },
  mailbox: { de: "Mailbox", tr: "Mailbox", en: "Mailbox" },
  pricing: { de: "Preisregeln", tr: "Fiyat kuralları", en: "Pricing rules" },
  template: { de: "Vorlage", tr: "Şablon", en: "Template" },
  workers: { de: "Mitarbeiter", tr: "Çalışanlar", en: "Workers" },
  package: { de: "Paket", tr: "Paket", en: "Package" },
  tasks: { de: "Aufgaben", tr: "Görevler", en: "Tasks" },
  approvals: { de: "Freigaben", tr: "Onaylar", en: "Approvals" },
  route: { de: "Seite", tr: "Sayfa", en: "Page" },
};

function facets(lang: AskLang, keys: string[]): string[] {
  return keys.map((k) => FACET[k][lang]);
}

const CONFIRM_NOTE: Record<AskLang, string> = {
  de: "Bitte bestätigen — ich ändere nichts ohne Ihre Freigabe.",
  tr: "Lütfen onaylayın — onayınız olmadan hiçbir şeyi değiştirmem.",
  en: "Please confirm — I won't change anything without your approval.",
};

/** Acknowledge the user's message naturally (varies a little, no randomness). */
function opener(lang: AskLang, message: string, continued: boolean): string {
  const even = message.length % 2 === 0;
  if (lang === "tr") return continued ? "Tabii." : even ? "Tamam." : "Olur.";
  if (lang === "en") return continued ? "Sure." : even ? "Got it." : "Okay.";
  return continued ? "Gerne." : even ? "Klar." : "Alles klar.";
}

/* -------------------------------------------------------------------------- */
/* Pricing proposal extraction                                                 */
/* -------------------------------------------------------------------------- */

function formatPrice(amount: number): string {
  return amount % 1 === 0 ? `CHF ${formatNumber(amount)}` : `CHF ${amount.toFixed(2)}`;
}

/** Pull an amount + a human label out of a "set X price to N" style message. */
function extractPrice(message: string): { label: string; amount: number } | null {
  const tokens = message.match(/\d+(?:[.,]\d+)?/g);
  if (!tokens || tokens.length === 0) return null;
  const parsed = tokens.map((t) => parseFloat(t.replace(",", ".")));
  const amount = Math.max(...parsed);
  const amountToken =
    tokens.find((t) => parseFloat(t.replace(",", ".")) === amount) ?? String(amount);

  let label = message
    .split(amountToken)
    .join(" ")
    .replace(/\b(chf|franken|fr\.?)\b/gi, " ")
    .replace(
      /\b(set|setze|setzen|auf|to|yap|yapar|olarak|kaydet|[aä]ndere|change|update|fiyat[ıi]n[ıi]?|fiyat|preis(?:es)?|price|pricing)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

  if (!label) label = message.replace(amountToken, "").trim();
  return { label, amount };
}

/**
 * Detect an approval-required action proposal from a message. Reused in AI mode
 * so actions stay structured + gated regardless of who wrote the prose.
 */
export function detectProposal(
  message: string,
  lang: AskLang,
): AskOfficeProposal | undefined {
  const intent = detectIntent(message);
  if (intent === "pricing_change") {
    const ex = extractPrice(message);
    const summary = ex
      ? `${ex.label || (lang === "tr" ? "Preisregel" : "Preisregel")} → ${formatPrice(ex.amount)}`
      : cleanSummary(message);
    return { kind: "pricing_change", summary, requiresConfirmation: true };
  }
  if (intent === "send_email") {
    return {
      kind: "send_email",
      summary:
        lang === "tr"
          ? "E-posta taslağı (onay gerekli)"
          : lang === "en"
            ? "Email draft (approval required)"
            : "E-Mail-Entwurf (Freigabe nötig)",
      requiresConfirmation: true,
    };
  }
  if (intent === "create_task") {
    return { kind: "task", summary: cleanSummary(message), requiresConfirmation: true };
  }
  if (intent === "draft_followup") {
    return {
      kind: "followup",
      summary:
        lang === "tr"
          ? "Takip mesajı taslağı"
          : lang === "en"
            ? "Follow-up message draft"
            : "Follow-up-Nachricht (Entwurf)",
      requiresConfirmation: true,
    };
  }
  return undefined;
}

/* -------------------------------------------------------------------------- */
/* The responder                                                               */
/* -------------------------------------------------------------------------- */

export function respond(
  message: string,
  ctx: AskOfficeContext,
  history?: AskTurn[],
): AskOfficeReply {
  const lang = detectLanguage(message);
  const intent = detectIntent(message);
  const continued = (history?.filter((t) => t.role === "user").length ?? 0) > 0;
  const op = opener(lang, message, continued);
  const mb = MAILBOX_LABEL[ctx.mailboxStatus][lang];

  switch (intent) {
    case "summarize": {
      const workers = joinList(ctx.activeWorkers, lang);
      const text =
        lang === "tr"
          ? `${op} ${ctx.companyName} için durum: kurulum ${ctx.setupDone}/${ctx.setupTotal}, ${ctx.activeWorkers.length} dijital çalışan aktif (${workers}). Mailbox ${mb}, ${ctx.openTasks} açık iş, ${ctx.pendingApprovals} bekleyen onay.`
          : lang === "en"
            ? `${op} Here's where ${ctx.companyName} stands: setup ${ctx.setupDone}/${ctx.setupTotal}, ${ctx.activeWorkers.length} digital workers active (${workers}). Mailbox ${mb}, ${ctx.openTasks} open task(s), ${ctx.pendingApprovals} pending approval(s).`
            : `${op} So steht ${ctx.companyName} gerade: Einrichtung ${ctx.setupDone}/${ctx.setupTotal}, ${ctx.activeWorkers.length} digitale Mitarbeiter aktiv (${workers}). Mailbox ${mb}, ${ctx.openTasks} offene Aufgabe(n), ${ctx.pendingApprovals} offene Freigabe(n).`;
      return {
        lang,
        text,
        suggestions: followUps(lang),
        contextUsed: facets(lang, ["setup", "workers", "mailbox", "tasks", "approvals"]),
      };
    }

    case "setup_gaps": {
      const gaps = joinList(ctx.missingSteps, lang);
      const text =
        ctx.missingSteps.length === 0
          ? lang === "tr"
            ? `${op} Kurulumda eksik adım yok — büronuz hazır.`
            : lang === "en"
              ? `${op} No setup steps are missing — your office is ready.`
              : `${op} Es fehlt kein Einrichtungsschritt — Ihr Büro ist bereit.`
          : lang === "tr"
            ? `${op} Eksik adımlar: ${gaps}. Önce bunları tamamlayın.`
            : lang === "en"
              ? `${op} Before launch, these are open: ${gaps}. Complete these first.`
              : `${op} Offen sind: ${gaps}. Bitte zuerst diese abschliessen.`;
      return { lang, text, suggestions: followUps(lang), contextUsed: facets(lang, ["setup"]) };
    }

    case "next_steps": {
      const first = ctx.missingSteps[0];
      const text = first
        ? lang === "tr"
          ? `${op} Sıradaki en iyi adım: „${first}". Ardından kalan adımlarla devam edin.`
          : lang === "en"
            ? `${op} Best next step: "${first}". Then continue with the remaining steps.`
            : `${op} Bester nächster Schritt: „${first}". Danach mit den restlichen Schritten weiter.`
        : lang === "tr"
          ? `${op} Kurulum tamam. Çalışanlarınıza görev vererek başlayabilirsiniz.`
          : lang === "en"
            ? `${op} Setup is complete. You can start by assigning tasks to your workers.`
            : `${op} Die Einrichtung ist abgeschlossen. Sie können Ihren Mitarbeitern Aufgaben geben.`;
      return { lang, text, suggestions: followUps(lang), contextUsed: facets(lang, ["setup"]) };
    }

    case "pending_approvals": {
      const text =
        ctx.pendingApprovals === 0
          ? lang === "tr"
            ? `${op} Bekleyen onay yok.`
            : lang === "en"
              ? `${op} There are no pending approvals.`
              : `${op} Es gibt keine offenen Freigaben.`
          : lang === "tr"
            ? `${op} ${ctx.pendingApprovals} bekleyen onay var. Her biri sizin onayınızı bekliyor.`
            : lang === "en"
              ? `${op} ${ctx.pendingApprovals} approval(s) are pending. Each waits for your sign-off.`
              : `${op} ${ctx.pendingApprovals} Freigabe(n) offen. Jede wartet auf Ihre Bestätigung.`;
      return { lang, text, suggestions: followUps(lang), contextUsed: facets(lang, ["approvals"]) };
    }

    case "create_task": {
      const proposal = detectProposal(message, lang);
      const text =
        lang === "tr"
          ? `${op} Bir görev taslağı hazırladım: „${proposal?.summary}". ${CONFIRM_NOTE.tr}`
          : lang === "en"
            ? `${op} I drafted a task: "${proposal?.summary}". ${CONFIRM_NOTE.en}`
            : `${op} Ich habe eine Aufgabe als Entwurf vorbereitet: „${proposal?.summary}". ${CONFIRM_NOTE.de}`;
      return { lang, text, proposal, suggestions: followUps(lang), contextUsed: facets(lang, ["workers", "tasks"]) };
    }

    case "draft_followup": {
      const proposal = detectProposal(message, lang);
      const text =
        lang === "tr"
          ? `${op} Bir takip mesajı taslağı hazırlayabilirim. ${CONFIRM_NOTE.tr}`
          : lang === "en"
            ? `${op} I can draft a follow-up message. ${CONFIRM_NOTE.en}`
            : `${op} Ich kann eine Follow-up-Nachricht als Entwurf vorbereiten. ${CONFIRM_NOTE.de}`;
      return { lang, text, proposal, suggestions: followUps(lang), contextUsed: facets(lang, ["tasks"]) };
    }

    case "explain_limits": {
      const text =
        lang === "tr"
          ? `${op} Paketiniz: ${ctx.packageName}. ${ctx.activeWorkers.length} çalışan aktif; ek olarak şunlar açılabilir: ${joinList(ctx.availableWorkers, lang)}. Ask Office seviyesi: ${ctx.askOfficeLevel}.`
          : lang === "en"
            ? `${op} Your package: ${ctx.packageName}. ${ctx.activeWorkers.length} workers active; you could also unlock: ${joinList(ctx.availableWorkers, lang)}. Ask Office level: ${ctx.askOfficeLevel}.`
            : `${op} Ihr Paket: ${ctx.packageName}. ${ctx.activeWorkers.length} Mitarbeiter aktiv; zusätzlich freischaltbar: ${joinList(ctx.availableWorkers, lang)}. Ask-Office-Stufe: ${ctx.askOfficeLevel}.`;
      return { lang, text, suggestions: followUps(lang), contextUsed: facets(lang, ["package", "workers"]) };
    }

    case "pricing_change": {
      const proposal = detectProposal(message, lang);
      const text =
        lang === "tr"
          ? `${op} Bunu fiyat kuralı değişikliği olarak hazırlayabilirim: „${proposal?.summary}". Onaylarsanız bu kuralı kaydedeceğim. ${CONFIRM_NOTE.tr}`
          : lang === "en"
            ? `${op} I can prepare this as a pricing-rule change: "${proposal?.summary}". I'll save it once you confirm. ${CONFIRM_NOTE.en}`
            : `${op} Ich kann das als Preisregel-Änderung vorbereiten: „${proposal?.summary}". Nach Ihrer Freigabe speichere ich die Regel. ${CONFIRM_NOTE.de}`;
      return { lang, text, proposal, suggestions: followUps(lang), contextUsed: facets(lang, ["pricing"]) };
    }

    case "suggest_pricing": {
      const text = ctx.hasPricingRules
        ? lang === "tr"
          ? `${op} Mevcut fiyat kurallarınızı gözden geçirip değişiklikleri öneri olarak sunabilirim.`
          : lang === "en"
            ? `${op} I can review your existing pricing rules and propose changes for your approval.`
            : `${op} Ich kann Ihre Preisregeln prüfen und Änderungen als Vorschlag vorlegen.`
        : lang === "tr"
          ? `${op} Henüz fiyat kuralı yok. Sabit fiyat, saatlik ücret veya ek ücret kuralıyla başlayabilirsiniz; örn. „3.5 Zimmer = 890 CHF".`
          : lang === "en"
            ? `${op} No pricing rules yet. Start with a fixed price, hourly rate or an add-on rule, e.g. "3.5 rooms = CHF 890".`
            : `${op} Noch keine Preisregeln. Beginnen Sie mit Fixpreis, Stundensatz oder Zuschlag, z. B. „3.5 Zimmer = CHF 890".`;
      return { lang, text, suggestions: followUps(lang), contextUsed: facets(lang, ["pricing"]) };
    }

    case "suggest_template": {
      const text = ctx.hasTemplate
        ? lang === "tr"
          ? `${op} Teklif şablonunuz hazır. Giriş metni, ödeme koşulları ve alt bilgiyi netleştirmenizi öneririm.`
          : lang === "en"
            ? `${op} Your offer template is ready. I'd refine the intro, payment terms and footer.`
            : `${op} Ihre Offerten-Vorlage ist vorbereitet. Ich würde Einleitung, Zahlungsbedingungen und Fusszeile schärfen.`
        : lang === "tr"
          ? `${op} Henüz teklif şablonu yok. Logo, adres, ödeme koşulları ve standart metinle bir tane hazırlayalım.`
          : lang === "en"
            ? `${op} No offer template yet. Let's prepare one with logo, address, payment terms and default text.`
            : `${op} Noch keine Offerten-Vorlage. Lassen Sie uns eine mit Logo, Adresse, Zahlungsbedingungen und Standardtext vorbereiten.`;
      return { lang, text, suggestions: followUps(lang), contextUsed: facets(lang, ["template"]) };
    }

    case "send_email": {
      const proposal = detectProposal(message, lang);
      const text =
        lang === "tr"
          ? `${op} E-postayı kendiliğinden göndermem. Bir taslak hazırlayıp onayınıza sunarım; gönderim ancak mailbox bağlıyken (şu an: ${mb}) ve siz onayladığınızda olur.`
          : lang === "en"
            ? `${op} I won't send email on my own. I'll prepare a draft for your approval; sending only happens when the mailbox is connected (now: ${mb}) and you approve.`
            : `${op} Ich sende keine E-Mail von selbst. Ich bereite einen Entwurf zur Freigabe vor; Versand nur, wenn die Mailbox verbunden ist (aktuell: ${mb}) und Sie freigeben.`;
      return { lang, text, proposal, suggestions: followUps(lang), contextUsed: facets(lang, ["mailbox"]) };
    }

    case "help":
    default: {
      const snippet = cleanSummary(message);
      const hint = ctx.missingSteps[0];
      const text =
        lang === "tr"
          ? `${op} „${snippet}" — bunu büro bağlamında ele alabilirim. ${hint ? `Şu an en önemli açık adım: „${hint}".` : "Kurulum tamam görünüyor."} Büroyu özetleyebilir, eksikleri gösterebilir, görev/takip taslağı hazırlayabilir veya fiyat/şablon önerebilirim.`
          : lang === "en"
            ? `${op} "${snippet}" — I can take that in the context of your office. ${hint ? `The most important open step right now is "${hint}".` : "Setup looks complete."} I can summarize the office, show gaps, draft a task or follow-up, or propose pricing/template changes.`
            : `${op} „${snippet}" — das kann ich im Kontext Ihres Büros aufnehmen. ${hint ? `Der wichtigste offene Schritt ist gerade „${hint}".` : "Die Einrichtung sieht vollständig aus."} Ich kann das Büro zusammenfassen, Lücken zeigen, Aufgaben/Follow-ups entwerfen oder Preis-/Vorlagen-Änderungen vorschlagen.`;
      return { lang, text, suggestions: defaultSuggestions(lang), contextUsed: facets(lang, ["route", "setup"]) };
    }
  }
}

/** A compact set of follow-up chips after an answer (same language). */
function followUps(lang: AskLang): string[] {
  switch (lang) {
    case "tr":
      return ["Sonraki adımları öner", "Bekleyen onayları göster", "Paket limitlerini açıkla"];
    case "en":
      return ["Suggest next steps", "Show pending approvals", "Explain package limits"];
    default:
      return ["Nächste Schritte vorschlagen", "Offene Freigaben zeigen", "Paketlimits erklären"];
  }
}

/** Trim a user message into a short, safe one-line summary for a proposal. */
function cleanSummary(message: string): string {
  const oneLine = message.replace(/\s+/g, " ").trim();
  return oneLine.length > 90 ? `${oneLine.slice(0, 87)}…` : oneLine;
}
