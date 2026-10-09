import "dotenv/config";
import express from "express";
import path from "path";
import { TYPES } from "./config";
import { classifyNote } from "./classify";
import { saveNote, getPendingReview, confirmType, getConfirmedBySprint } from "./storage";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// Lijst met vaste types, voor de dropdown in de review-UI
app.get("/api/types", (_req, res) => {
  res.json(TYPES);
});

// Nieuwe notitie: classificeren + opslaan
app.post("/api/notes", async (req, res) => {
  try {
    const { noteText, sprint } = req.body as { noteText?: string; sprint?: string };

    if (!noteText?.trim() || !sprint?.trim()) {
      return res.status(400).json({ error: "noteText en sprint zijn beide verplicht." });
    }

    const classification = await classifyNote(noteText);
    const saved = await saveNote(noteText, sprint, classification);
    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Alle notities die nog op review wachten
app.get("/api/pending", async (_req, res) => {
  try {
    res.json(await getPendingReview());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Type bevestigen of corrigeren voor een notitie in review
app.post("/api/notes/:id/confirm", async (req, res) => {
  try {
    const { type } = req.body as { type?: string };
    if (!type) {
      return res.status(400).json({ error: "type is verplicht." });
    }
    await confirmType(req.params.id, type);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Overzicht van alle bevestigde notities, per sprint en type
app.get("/api/overview", async (_req, res) => {
  try {
    res.json(await getConfirmedBySprint());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`Studienotities-organizer draait op http://localhost:${PORT}`);
});
