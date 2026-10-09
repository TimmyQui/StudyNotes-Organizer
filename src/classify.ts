import "dotenv/config";
import { TYPES, GROQ_MODEL } from "./config";
import type { ClassificationResult } from "./types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function buildSystemPrompt(): string {
  return `Je bent een assistent die studienotities van een software engineering
student classificeert. De student werkt in scrum-projectgroepen; elke notitie
hoort bij één van deze vaste categorieën:
${TYPES.map((t) => `- ${t}`).join("\n")}

Betekenis van de categorieën:
- "Expert Review": feedback van een expert/docent op geleverd werk.
- "Retrospective": aantekeningen van een sprint-retrospective (wat ging goed/fout, acties).
- "Framework/Techniek onderzoek": zelfstudie-notities over een framework, taal of techniek.
- "Meeting opdrachtgever": verslag of aantekeningen van een gesprek met de opdrachtgever.
- "Overig": alleen gebruiken als de notitie duidelijk bij geen van de andere past.

Geef ALTIJD een antwoord in exact dit JSON-formaat, zonder extra tekst of markdown-opmaak eromheen:
{
  "type": "een van de bovenstaande categorieën, exact zo geschreven",
  "title": "korte titel van max 6 woorden voor deze notitie",
  "confidence": 0-100,
  "reasoning": "één zin waarom dit type past"
}`;
}

export async function classifyNote(noteText: string): Promise<ClassificationResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY ontbreekt. Zet hem in je .env bestand.");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: `Classificeer deze notitie:\n\n${noteText}` },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API fout (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const rawContent = data.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error("Geen inhoud terugontvangen van de Groq API.");
  }

  const parsed = JSON.parse(rawContent) as ClassificationResult;

  // Kleine veiligheidscheck: valt het type echt in onze lijst?
  if (!TYPES.includes(parsed.type)) {
    parsed.type = "Overig";
    parsed.confidence = Math.min(parsed.confidence, 50);
  }

  return parsed;
}
