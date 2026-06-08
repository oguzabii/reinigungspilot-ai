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
    a: "Nicht im klassischen Sinn. Klarsa ist ein KI-Verkaufsbüro: Es sammelt Anfragen, erstellt Offerten, fasst nach und plant Aufträge. CRM-Funktionen sind enthalten – der Fokus liegt aber auf Abschlüssen, nicht auf reiner Datenpflege.",
  },
  {
    q: "Garantiert das System neue Kunden?",
    a: "Nein – eine Umsatz- oder Kundengarantie geben wir bewusst nicht. Klarsa sorgt dafür, dass keine Anfrage liegen bleibt, Offerten schneller draussen sind und konsequent nachgefasst wird. Das verbessert Ihre Abschlusschancen spürbar, bleibt aber ein Werkzeug in den Händen Ihres Teams – kein Automat, der Aufträge garantiert.",
  },
  {
    q: "Versendet die KI automatisch Nachrichten?",
    a: "Nein. Die KI bereitet Offerten, E-Mails und Erstnachrichten vor und legt sie Ihnen vor. Den Versand geben Sie frei – einzeln und kontrolliert. Es gibt kein automatisches Massen- oder Spam-System, und nichts verlässt das Haus ohne Ihr Einverständnis.",
  },
  {
    q: "Wem gehören die Daten?",
    a: "Ihre Daten gehören Ihnen – Kunden, Offerten und Aufträge. Sie werden nicht verkauft und nicht für andere Betriebe verwendet. Zur Produktverbesserung nutzen wir ausschliesslich anonymisierte, nicht personenbezogene Erkenntnisse; Ihre konkreten Kundendaten bleiben aussen vor.",
  },
  {
    q: "Was passiert nach der Einrichtung?",
    a: "Nach dem Setup ist Ihr Verkaufsbüro startklar: Anfragen laufen zentral ein, Offerten und Follow-ups sind vorbereitet. Wir begleiten Sie beim Go-Live und optimieren in den ersten Wochen gemeinsam.",
  },
  {
    q: "Brauche ich eine neue Website?",
    a: "Nein. Klarsa arbeitet unabhängig von Ihrer Website. Sie können Ihr bestehendes Kontakt- oder Web-Formular optional anbinden (Add-on), damit Anfragen direkt in der Inbox landen – nötig ist das nicht, und eine neue Website brauchen Sie dafür sicher nicht.",
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
    q: "Kann ich das auch einmalig kaufen?",
    a: "Nein. Klarsa ist ein laufender Service: einmalige Einrichtung plus monatliches Abo. So sind Betreuung, Optimierung und Updates dauerhaft enthalten – statt einer Software, die nach dem Kauf veraltet. Den passenden Einstieg klären wir in einer kurzen Beratung.",
  },
  {
    q: "Ersetzt das System bexio?",
    a: "Nein. Klarsa ersetzt Ihre Buchhaltung nicht. Es übergibt gewonnene Aufträge mit Kundendaten, Leistung und MwSt. an bexio und erstellt dort einen Rechnungsentwurf – gebucht wird wie gewohnt in bexio.",
  },
  {
    q: "Ist bexio im Pro-Paket enthalten?",
    a: "Ja. bexio Connect ist ab dem Pro-Paket enthalten, Premium bietet bexio Connect Plus mit erweitertem Funktionsumfang. Im Starter ist die bexio-Übergabe nicht enthalten.",
  },
  {
    q: "Was, wenn ich CashCtrl nutze?",
    a: "Aktuell konzentrieren wir uns auf die bexio-Anbindung. Weitere Buchhaltungslösungen wie CashCtrl sind für später geplant – sprechen Sie uns in der Beratung darauf an.",
  },
  {
    q: "Muss ich meine Buchhaltung wechseln?",
    a: "Nein. Sie behalten Ihre Buchhaltung. Klarsa liefert die Auftragsdaten sauber an bexio – ein Wechsel Ihrer Buchhaltung ist nicht nötig.",
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
    q: "Ist das nur für Reinigungsfirmen?",
    a: "Nein. Klarsa ist das KI-Verkaufsbüro für Schweizer KMU – Dienstleister, Handwerk, Umzug, Gartenbau, Hauswartung, Maler/Gipser und mehr. Reinigung ist unsere erste Branchenvorlage, nicht das ganze Produkt.",
  },
  {
    q: "Wie wird das System pro Branche eingerichtet?",
    a: "Über Branchenvorlagen. Für jede Branche sind typische Leads, Offertfelder, Follow-ups und Abläufe vorkonfiguriert. Beim Setup passen wir die passende Vorlage an Ihren Betrieb an.",
  },
  {
    q: "Kann das System meine bestehenden Preise übernehmen?",
    a: "Ja. Ihre Preismodelle und Services werden beim Setup hinterlegt, sodass Offerten zu Ihren echten Preisen entstehen. Bestehende Daten lassen sich per Datenmigration (Add-on) übernehmen.",
  },
];
