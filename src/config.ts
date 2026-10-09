// Vaste categorieën die tijdens een sprint terugkomen.
// "Overig" is het vangnet voor notities die nergens goed bij passen.
export const TYPES = [
  "Expert Review",
  "Retrospective",
  "Framework/Techniek onderzoek",
  "Meeting opdrachtgever",
  "Overig",
];

// Onder deze confidence-score wordt een notitie voor review gemarkeerd
// in plaats van automatisch weggeschreven
export const CONFIDENCE_THRESHOLD = 80;

export const NOTES_DIR = "notes";
export const METADATA_FILE = "data/metadata.json";
// llama-3.3-70b-versatile is door Groq uitgefaseerd (aug. 2026);
// dit is de aanbevolen, gratis vervanger.
export const GROQ_MODEL = "openai/gpt-oss-120b";
