/**
 * Ask Office — deterministic, context-aware assistant engine (vNext).
 *
 * This is the brain behind the "Ask Office" slide-over panel. It is a PURE,
 * LOCAL engine: no external AI API, no I/O, no secrets — client- and
 * server-safe. v1 produces structured, contextual answers in the user's
 * language and, for any change, a PROPOSAL that the UI must confirm before
 * anything is persisted (this foundation persists nothing — see the doc).
 *
 * Language behaviour (like YouTube Studio's Ask panel):
 *   - The panel opens in German (greeting, chips, placeholder).
 *   - Each user message is language-detected; the reply uses that language.
 *   - Supported: German, Turkish, English. Unclear → German (Swiss default).
 *   - Business object names are never translated.
 */

import type { AskOfficeLevel, OfficePackageId } from "./pricing";
import type { MailboxStatus } from "./office";

export type AskLang = "de" | "tr" | "en";

/** Serializable context the page hands the panel (no functions, no PII bodies). */
export interface AskOfficeContext {
  packageId: OfficePackageId;
  packageName: string;
  askOfficeLevel: AskOfficeLevel;
  companyName: string;
  /** Current route, e.g. "/app-shell/digital-office". */
  route: string;
  setupDone: number;
  setupTotal: number;
  /** German labels of the steps still open. */
  missingSteps: string[];
  /** German names of the active workers. */
  activeWorkers: string[];
  pendingApprovals: number;
  openTasks: number;
  mailboxStatus: MailboxStatus;
  hasTemplate: boolean;
  hasPricingRules: boolean;
}

export type ProposalKind =
  | "pricing_change"
  | "send_email"
  | "task"
  | "followup"
  | "template"
  | "generic";

export interface AskOfficeProposal {
  kind: ProposalKind;
  /** Short German/loc summary of what WOULD happen. */
  summary: string;
  requiresConfirmation: true;
}

export interface AskOfficeReply {
  lang: AskLang;
  text: string;
  proposal?: AskOfficeProposal;
  /** Follow-up suggestion chips in the same language. */
  suggestions?: string[];
}

/* -------------------------------------------------------------------------- */
/* Language detection                                                          */
/* -------------------------------------------------------------------------- */

const TR_WORDS =
  /\b(bug[uü]n|i[şs]ler|i[şs]|[oö]zetle|[oö]zet|g[oö]ster|haz[ıi]rla|neler|nas[ıi]l|fiyat|teklif|m[uü][şs]teri|m[uü][şs]teriler|i[çc]in|l[uü]tfen|a[çc]|yap|takip|hat[ıi]rlat|g[oö]nder|durum|paket|s[ıi]n[ıi]r|onay|g[oö]rev|adım|sonraki|eksik|kurulum|merhaba)\b/i;
const TR_CHARS = /[ışğİ]/; // ç/ö/ü also appear in German, so only the distinctive ones

const EN_WORDS =
  /\b(the|my|show|summar(?:y|ize|ise)|today|what|how|please|create|draft|office|task|tasks|pending|approval|approvals|price|pricing|offer|template|send|email|next|step|steps|missing|setup|gap|gaps|limit|package|plan|hello|hi)\b/i;

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

  // English is the safest "neutral" tie-breaker only when it clearly wins.
  if (tr >= de && tr > en && tr > 0) return "tr";
  if (en > de && en > tr) return "en";
  if (de > 0) return "de";
  if (tr > 0) return "tr";
  if (en > 0) return "en";
  return "de";
}

/* -------------------------------------------------------------------------- */
/* Static UI copy (greeting / placeholder / default chips)                     */
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

/** Default quick-suggestion chips. The panel opens with the German set. */
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

const SET_VERB = /\b(set|auf|=|to|yap|setze|ändere|change|update)\b/i;
const HAS_NUMBER = /\d/;

function detectIntent(text: string): Intent {
  const t = text.toLowerCase();

  const pricing = /(preis|preisregel|chf|rabatt|zuschlag|stundensatz|fiyat|[uü]cret|indirim|price|pricing|rate|discount)/i.test(t);
  if (pricing && HAS_NUMBER.test(t) && SET_VERB.test(t)) return "pricing_change";

  if (/(sende|senden|verschick|g[oö]nder|mail g[oö]nder|send|e-?mail)/i.test(t)) return "send_email";
  if (/(freigabe|freigaben|genehmig|onay|approval|approvals|pending)/i.test(t)) return "pending_approvals";
  if (/(follow-?up|nachfass|erinnerung|takip|hat[ıi]rlat|reminder)/i.test(t)) return "draft_followup";
  if (/(aufgabe|task|g[oö]rev)/i.test(t)) return "create_task";
  if (/(vorlage|offerte|pdf|[şs]ablon|teklif|template|offer)/i.test(t)) return "suggest_template";
  if (pricing) return "suggest_pricing";
  if (/(paket|limit|grenzen|tarif|s[ıi]n[ıi]r|package|plan)/i.test(t)) return "explain_limits";
  if (/(fehlt|einrichtung|l[uü]cke|eksik|kurulum|missing|setup|gap)/i.test(t)) return "setup_gaps";
  if (/(n[aä]chste|schritte|empfehl|sonraki|ad[ıi]m|[oö]ner|ne yapmal|next|step|recommend|what should)/i.test(t)) return "next_steps";
  if (/(zusammen|[uü]berblick|fasse|status|[oö]zetle|[oö]zet|durum|summar|overview)/i.test(t)) return "summarize";

  return "help";
}

/* -------------------------------------------------------------------------- */
/* Small localisation helpers                                                  */
/* -------------------------------------------------------------------------- */

function joinList(items: string[], lang: AskLang): string {
  if (items.length === 0) {
    return lang === "tr" ? "yok" : lang === "en" ? "none" : "keine";
  }
  if (items.length === 1) return items[0];
  const sep = ", ";
  const last = lang === "tr" ? " ve " : lang === "en" ? " and " : " und ";
  return items.slice(0, -1).join(sep) + last + items[items.length - 1];
}

const MAILBOX_LABEL: Record<MailboxStatus, Record<AskLang, string>> = {
  not_connected: { de: "nicht verbunden", tr: "bağlı değil", en: "not connected" },
  configured: { de: "konfiguriert", tr: "yapılandırıldı", en: "configured" },
  connected: { de: "verbunden", tr: "bağlı", en: "connected" },
  error: { de: "Fehler", tr: "hata", en: "error" },
};

const CONFIRM_NOTE: Record<AskLang, string> = {
  de: "Bitte bestätigen — ich ändere nichts ohne Ihre Freigabe.",
  tr: "Lütfen onaylayın — onayınız olmadan hiçbir şeyi değiştirmem.",
  en: "Please confirm — I won't change anything without your approval.",
};

/* -------------------------------------------------------------------------- */
/* The responder                                                               */
/* -------------------------------------------------------------------------- */

export function respond(message: string, ctx: AskOfficeContext): AskOfficeReply {
  const lang = detectLanguage(message);
  const intent = detectIntent(message);
  const mb = MAILBOX_LABEL[ctx.mailboxStatus][lang];

  switch (intent) {
    case "summarize": {
      const workers = joinList(ctx.activeWorkers, lang);
      const text =
        lang === "tr"
          ? `${ctx.companyName}: kurulum ${ctx.setupDone}/${ctx.setupTotal} tamam, ${ctx.activeWorkers.length} dijital çalışan aktif (${workers}). Mailbox ${mb}, ${ctx.openTasks} açık iş, ${ctx.pendingApprovals} bekleyen onay.`
          : lang === "en"
            ? `${ctx.companyName}: setup ${ctx.setupDone}/${ctx.setupTotal} done, ${ctx.activeWorkers.length} digital workers active (${workers}). Mailbox ${mb}, ${ctx.openTasks} open task(s), ${ctx.pendingApprovals} pending approval(s).`
            : `${ctx.companyName}: Einrichtung ${ctx.setupDone}/${ctx.setupTotal} erledigt, ${ctx.activeWorkers.length} digitale Mitarbeiter aktiv (${workers}). Mailbox ${mb}, ${ctx.openTasks} offene Aufgabe(n), ${ctx.pendingApprovals} offene Freigabe(n).`;
      return { lang, text, suggestions: followUps(lang) };
    }

    case "setup_gaps": {
      const gaps = joinList(ctx.missingSteps, lang);
      const text =
        ctx.missingSteps.length === 0
          ? lang === "tr"
            ? "Kurulumda eksik bir adım yok — büronuz hazır."
            : lang === "en"
              ? "No setup steps are missing — your office is ready."
              : "Es fehlt kein Einrichtungsschritt — Ihr Büro ist bereit."
          : lang === "tr"
            ? `Eksik adımlar: ${gaps}. Önce bunları tamamlayın.`
            : lang === "en"
              ? `Missing steps: ${gaps}. Complete these first.`
              : `Offene Schritte: ${gaps}. Bitte zuerst diese abschliessen.`;
      return { lang, text, suggestions: followUps(lang) };
    }

    case "next_steps": {
      const first = ctx.missingSteps[0];
      const text = first
        ? lang === "tr"
          ? `Sıradaki en iyi adım: "${first}". Ardından kalan adımlarla devam edin.`
          : lang === "en"
            ? `Best next step: "${first}". Then continue with the remaining steps.`
            : `Bester nächster Schritt: „${first}". Danach mit den restlichen Schritten weiter.`
        : lang === "tr"
          ? "Kurulum tamam. Çalışanlarınıza görev vererek başlayabilirsiniz."
          : lang === "en"
            ? "Setup is complete. You can start by assigning tasks to your workers."
            : "Die Einrichtung ist abgeschlossen. Sie können Ihren Mitarbeitern Aufgaben geben.";
      return { lang, text, suggestions: followUps(lang) };
    }

    case "pending_approvals": {
      const text =
        ctx.pendingApprovals === 0
          ? lang === "tr"
            ? "Bekleyen onay yok."
            : lang === "en"
              ? "There are no pending approvals."
              : "Es gibt keine offenen Freigaben."
          : lang === "tr"
            ? `${ctx.pendingApprovals} bekleyen onay var. Her biri sizin onayınızı bekliyor.`
            : lang === "en"
              ? `${ctx.pendingApprovals} approval(s) are pending. Each waits for your sign-off.`
              : `${ctx.pendingApprovals} Freigabe(n) offen. Jede wartet auf Ihre Bestätigung.`;
      return { lang, text, suggestions: followUps(lang) };
    }

    case "create_task": {
      const summary = cleanSummary(message);
      const text =
        lang === "tr"
          ? `Bir görev taslağı hazırladım: "${summary}". ${CONFIRM_NOTE.tr}`
          : lang === "en"
            ? `I drafted a task: "${summary}". ${CONFIRM_NOTE.en}`
            : `Ich habe eine Aufgabe als Entwurf vorbereitet: „${summary}". ${CONFIRM_NOTE.de}`;
      return {
        lang,
        text,
        proposal: { kind: "task", summary, requiresConfirmation: true },
        suggestions: followUps(lang),
      };
    }

    case "draft_followup": {
      const text =
        lang === "tr"
          ? "Bir takip mesajı taslağı hazırlayabilirim. " + CONFIRM_NOTE.tr
          : lang === "en"
            ? "I can draft a follow-up message. " + CONFIRM_NOTE.en
            : "Ich kann eine Follow-up-Nachricht als Entwurf vorbereiten. " + CONFIRM_NOTE.de;
      return {
        lang,
        text,
        proposal: {
          kind: "followup",
          summary:
            lang === "tr"
              ? "Takip mesajı taslağı"
              : lang === "en"
                ? "Follow-up message draft"
                : "Follow-up-Nachricht (Entwurf)",
          requiresConfirmation: true,
        },
        suggestions: followUps(lang),
      };
    }

    case "explain_limits": {
      const text =
        lang === "tr"
          ? `Paketiniz: ${ctx.packageName}. ${ctx.activeWorkers.length} çalışan aktif. Ask Office seviyesi: ${ctx.askOfficeLevel}. Daha fazlası için paketinizi yükseltebilirsiniz.`
          : lang === "en"
            ? `Your package: ${ctx.packageName}. ${ctx.activeWorkers.length} workers active. Ask Office level: ${ctx.askOfficeLevel}. Upgrade for more workers, mailboxes and automation.`
            : `Ihr Paket: ${ctx.packageName}. ${ctx.activeWorkers.length} Mitarbeiter aktiv. Ask-Office-Stufe: ${ctx.askOfficeLevel}. Für mehr Mitarbeiter, Mailboxen und Automatisierung upgraden.`;
      return { lang, text, suggestions: followUps(lang) };
    }

    case "pricing_change": {
      const summary = cleanSummary(message);
      const text =
        lang === "tr"
          ? `Öneri: fiyat kuralını güncelle — "${summary}". ${CONFIRM_NOTE.tr}`
          : lang === "en"
            ? `Proposal: update the pricing rule — "${summary}". ${CONFIRM_NOTE.en}`
            : `Vorschlag: Preisregel aktualisieren — „${summary}". ${CONFIRM_NOTE.de}`;
      return {
        lang,
        text,
        proposal: { kind: "pricing_change", summary, requiresConfirmation: true },
        suggestions: followUps(lang),
      };
    }

    case "suggest_pricing": {
      const base = ctx.hasPricingRules
        ? lang === "tr"
          ? "Mevcut fiyat kurallarınızı gözden geçirebilirim ve değişiklikleri öneri olarak sunarım."
          : lang === "en"
            ? "I can review your existing pricing rules and propose changes for your approval."
            : "Ich kann Ihre Preisregeln prüfen und Änderungen als Vorschlag vorlegen."
        : lang === "tr"
          ? "Henüz fiyat kuralı yok. Sabit fiyat, saatlik ücret veya ek ücret kuralıyla başlayabilirsiniz."
          : lang === "en"
            ? "No pricing rules yet. Start with a fixed price, an hourly rate or an add-on rule."
            : "Noch keine Preisregeln. Beginnen Sie mit Fixpreis, Stundensatz oder einer Zuschlag-Regel.";
      return { lang, text: base, suggestions: followUps(lang) };
    }

    case "suggest_template": {
      const text = ctx.hasTemplate
        ? lang === "tr"
          ? "Teklif şablonunuz hazır. İçeriği, ödeme koşullarını ve alt bilgiyi netleştirmenizi öneririm."
          : lang === "en"
            ? "Your offer template is ready. I'd refine the intro, payment terms and footer."
            : "Ihre Offerten-Vorlage ist vorbereitet. Ich würde Einleitung, Zahlungsbedingungen und Fusszeile schärfen."
        : lang === "tr"
          ? "Henüz teklif şablonu yok. Logo, adres, ödeme koşulları ve standart metinle bir tane hazırlayalım."
          : lang === "en"
            ? "No offer template yet. Let's prepare one with logo, address, payment terms and default text."
            : "Noch keine Offerten-Vorlage. Lassen Sie uns eine mit Logo, Adresse, Zahlungsbedingungen und Standardtext vorbereiten.";
      return { lang, text, suggestions: followUps(lang) };
    }

    case "send_email": {
      const text =
        lang === "tr"
          ? "E-postayı kendiliğinden göndermem. Bir taslak hazırlayıp onayınıza sunarım; gönderim ancak mailbox bağlıyken ve siz onayladığınızda olur."
          : lang === "en"
            ? "I won't send email on my own. I'll prepare a draft for your approval; sending only happens when the mailbox is connected and you approve."
            : "Ich sende keine E-Mail von selbst. Ich bereite einen Entwurf zur Freigabe vor; Versand nur, wenn die Mailbox verbunden ist und Sie freigeben.";
      return {
        lang,
        text,
        proposal: {
          kind: "send_email",
          summary:
            lang === "tr" ? "E-posta taslağı (onay gerekli)" : lang === "en" ? "Email draft (approval required)" : "E-Mail-Entwurf (Freigabe nötig)",
          requiresConfirmation: true,
        },
        suggestions: followUps(lang),
      };
    }

    case "help":
    default: {
      const text =
        lang === "tr"
          ? "Şunları yapabilirim: büroyu özetlemek, eksik kurulumu göstermek, sonraki adımları önermek, görev/takip taslağı hazırlamak, paket limitlerini açıklamak ve fiyat/şablon önerileri sunmak."
          : lang === "en"
            ? "I can summarize your office, show setup gaps, suggest next steps, draft a task or follow-up, explain package limits, and propose pricing or template changes."
            : "Ich kann Ihr Büro zusammenfassen, fehlende Einrichtung zeigen, nächste Schritte vorschlagen, Aufgaben/Follow-ups entwerfen, Paketlimits erklären und Preis- oder Vorlagen-Änderungen vorschlagen.";
      return { lang, text, suggestions: defaultSuggestions(lang) };
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
