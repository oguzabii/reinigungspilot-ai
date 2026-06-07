/**
 * Shared sales objection handling.
 *
 * Central source used by both the internal demo script (/demo-script) and the
 * sales kit (/sales-kit). Tone: calm, specific, no overpromising, "AI prepares
 * – the human stays in control".
 */

export interface Objection {
  q: string;
  a: string;
}

export const OBJECTIONS: Objection[] = [
  {
    q: "„Wir haben schon ein CRM.“",
    a: "Gut – ReinigungsPilot AI muss es nicht ersetzen. Der Fokus liegt auf dem Verkauf: Anfragen schneller in Offerten verwandeln, konsequent nachfassen und aktiv B2B-Kunden ansprechen. Das ergänzt ein CRM, statt es zu doppeln.",
  },
  {
    q: "„Wir bekommen genug Anfragen.“",
    a: "Sehr gut. Dann geht es nicht ums Finden, sondern ums Gewinnen: Aus denselben Anfragen holen schnellere Offerten und sauberes Nachfassen mehr Aufträge heraus.",
  },
  {
    q: "„AI ist mir zu unsicher.“",
    a: "Verständlich. Die AI bereitet nur vor – jeden Versand geben Sie frei. Nichts geht unkontrolliert raus, und Ihre Daten bleiben Ihre Daten.",
  },
  {
    q: "„Das ist zu teuer.“",
    a: "Rechnen wir es an Ihren Zahlen durch: Schon ein zusätzlicher Auftrag pro Monat deckt das Abo meist mehrfach. In einer kurzen Beratung machen wir die Rechnung konkret.",
  },
  {
    q: "„Wir haben keine Zeit für ein neues System.“",
    a: "Genau deshalb übernehmen wir die Einrichtung. Sie erhalten ein fertig eingerichtetes Verkaufsbüro – das spart ab dem ersten Tag Zeit, statt welche zu kosten.",
  },
  {
    q: "„Kann ich das auch einmalig kaufen?“",
    a: "Nein, ReinigungsPilot AI ist ein laufender Service (Einrichtung plus monatliches Abo). So bleiben Betreuung, Optimierung und Updates enthalten. Den passenden Einstieg klären wir in einer kurzen Beratung.",
  },
];
