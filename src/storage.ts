import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { NOTES_DIR, METADATA_FILE, CONFIDENCE_THRESHOLD } from "./config";
import type { ClassificationResult, NoteMetadata } from "./types";

async function ensureDataFile(): Promise<void> {
  try {
    await fs.access(METADATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(METADATA_FILE), { recursive: true });
    await fs.writeFile(METADATA_FILE, "[]", "utf-8");
  }
}

async function readAllMetadata(): Promise<NoteMetadata[]> {
  await ensureDataFile();
  const raw = await fs.readFile(METADATA_FILE, "utf-8");
  return JSON.parse(raw) as NoteMetadata[];
}

async function writeAllMetadata(entries: NoteMetadata[]): Promise<void> {
  await fs.writeFile(METADATA_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

function buildFilePath(sprint: string, type: string, title: string): string {
  const dir = path.join(NOTES_DIR, slugify(sprint), slugify(type));
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `${dateStr}-${slugify(title)}.md`;
  return path.join(dir, fileName);
}

/**
 * Slaat een notitie op. Sprint geef je zelf mee (kan niet betrouwbaar uit de
 * tekst worden afgeleid), type komt uit de classificatie.
 * - Bij hoge confidence: `reviewed: true`, meteen "definitief".
 * - Bij lage confidence: `reviewed: false` zodat de review-stap 'm apart
 *   toont totdat iemand het type bevestigt of corrigeert.
 */
export async function saveNote(
  noteText: string,
  sprint: string,
  classification: ClassificationResult
): Promise<NoteMetadata> {
  const filePath = buildFilePath(sprint, classification.type, classification.title);
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  await fs.writeFile(
    filePath,
    `# ${classification.title}\n\nSprint: ${sprint}\nType: ${classification.type}\n\n${noteText}\n`,
    "utf-8"
  );

  const entry: NoteMetadata = {
    id: randomUUID(),
    sprint,
    originalText: noteText,
    createdAt: new Date().toISOString(),
    reviewed: classification.confidence >= CONFIDENCE_THRESHOLD,
    filePath,
    ...classification,
  };

  const all = await readAllMetadata();
  all.push(entry);
  await writeAllMetadata(all);

  return entry;
}

/** Alle notities die nog handmatig bevestigd moeten worden (lage confidence). */
export async function getPendingReview(): Promise<NoteMetadata[]> {
  const all = await readAllMetadata();
  return all.filter((n) => !n.reviewed);
}

/** Verplaatst een notitie naar een ander type en markeert 'm als bevestigd. */
export async function confirmType(noteId: string, correctedType: string): Promise<void> {
  const all = await readAllMetadata();
  const entry = all.find((n) => n.id === noteId);
  if (!entry) throw new Error(`Notitie met id ${noteId} niet gevonden.`);

  if (entry.type !== correctedType) {
    const newPath = buildFilePath(entry.sprint, correctedType, entry.title);
    await fs.mkdir(path.dirname(newPath), { recursive: true });
    await fs.rename(entry.filePath, newPath);
    entry.filePath = newPath;
    entry.type = correctedType;
  }

  entry.reviewed = true;
  await writeAllMetadata(all);
}

/** Bevestigde notities, gegroepeerd per sprint en daarbinnen per type. */
export async function getConfirmedBySprint(): Promise<
  Record<string, Record<string, NoteMetadata[]>>
> {
  const all = await readAllMetadata();
  const confirmed = all.filter((n) => n.reviewed);

  return confirmed.reduce((acc, note) => {
    acc[note.sprint] ??= {};
    (acc[note.sprint][note.type] ??= []).push(note);
    return acc;
  }, {} as Record<string, Record<string, NoteMetadata[]>>);
}
