/**
 * Frequently asked questions / objection handling.
 *
 * Central, honest answers used on the /faq page. Tone: professional Swiss B2B,
 * no overpromising (no guaranteed revenue, no uncontrolled automation).
 */

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Ist das ein CRM?",
    a: "Nicht im klassischen Sinn. ReinigungsPilot AI ist ein AI-Verkaufsbüro: Es sammelt Anfragen, erstellt Offerten, fasst nach und plant Aufträge. CRM-Funktionen sind enthalten – der Fokus liegt aber auf Abschlüssen, nicht auf reiner Datenpflege.",
  },
  {
    q: "Garantiert das System neue Kunden?",
    a: "Nein, eine Umsatzgarantie gibt es nicht. ReinigungsPilot AI sorgt dafür, dass keine Anfrage verloren geht, Offerten schneller draussen sind und konsequent nachgefasst wird. Das erhöht Ihre Chancen deutlich – es bleibt aber ein Werkzeug, kein Versprechen.",
  },
  {
    q: "Versendet die AI automatisch Nachrichten?",
    a: "Nein, nicht unkontrolliert. Die AI bereitet Offerten, E-Mails und Erstnachrichten vor. Sie behalten die Kontrolle und geben den Versand frei. Ein automatisches Massen- oder Spam-System ist es ausdrücklich nicht.",
  },
  {
    q: "Wem gehören die Daten?",
    a: "Ihre Daten gehören Ihnen. Sie bleiben Eigentümer Ihrer Kunden-, Offerten- und Auftragsdaten. Im Pilot dürfen ausschliesslich anonymisierte Erkenntnisse zur Produktverbesserung genutzt werden – keine persönlichen Kundendaten.",
  },
  {
    q: "Was passiert nach der Einrichtung?",
    a: "Nach dem Setup ist Ihr Verkaufsbüro startklar: Anfragen laufen zentral ein, Offerten und Follow-ups sind vorbereitet. Wir begleiten Sie beim Go-Live und optimieren in den ersten Wochen gemeinsam.",
  },
  {
    q: "Brauche ich eine neue Website?",
    a: "Nein. ReinigungsPilot AI funktioniert unabhängig von Ihrer Website. Optional lässt sich Ihr bestehendes Web-Formular anbinden (Add-on) – eine neue Website ist nicht nötig.",
  },
  {
    q: "Funktioniert es auch ohne Google Ads?",
    a: "Ja. Google Ads sind optional (Add-on). Das System arbeitet mit Ihren bestehenden Anfragen und – ab Pro – mit aktiver B2B-Akquise über den Lead Hunter, ganz ohne Werbebudget.",
  },
  {
    q: "Was ist im monatlichen Preis enthalten?",
    a: "Der Zugang zu den Modulen Ihres Pakets inklusive der jeweiligen Limiten (Leads, Offerten, Nutzer, Postfächer, Support). Die genauen Werte stehen auf der Preisseite. Die Einrichtung wird einmalig verrechnet.",
  },
  {
    q: "Kann ich später upgraden?",
    a: "Ja, jederzeit. Sie wechseln von Starter zu Pro oder Premium, sobald Sie mehr Leistung oder höhere Limiten brauchen.",
  },
  {
    q: "Was passiert, wenn ich kündige?",
    a: "Das Abo läuft monatlich. Bei einer Kündigung endet der Zugang zum Ende der laufenden Periode; Ihre Daten stellen wir Ihnen vorher zur Verfügung.",
  },
  {
    q: "Ist das nur für Umzugsreinigung?",
    a: "Nein. ReinigungsPilot AI ist für Reinigungsfirmen allgemein gedacht: Unterhalts-, Büro-, Praxis-, Treppenhaus-, Bau- und Umzugsreinigung. Umzugsreinigung ist nur eines von vielen Beispielen.",
  },
  {
    q: "Kann das System meine bestehenden Preise übernehmen?",
    a: "Ja. Ihre Preismodelle und Services werden beim Setup hinterlegt, sodass Offerten zu Ihren echten Preisen entstehen. Bestehende Daten lassen sich per Datenmigration (Add-on) übernehmen.",
  },
];
