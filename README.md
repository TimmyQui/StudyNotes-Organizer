# Study Notes Organizer

A semi-automated workflow that classifies loose study notes from a Scrum
project by sprint and type, using an LLM, with a human checkpoint for
uncertain cases.

> The user interface and note categories are in Dutch, since the tool was
> built for my own use during my studies in the Netherlands.

## Why this project

During my studies I work in Scrum project teams and do a lot of self-study.
Notes on expert reviews, retrospectives, framework research and client
meetings quickly end up scattered everywhere. This project solves that: you
drop in a note, an LLM decides what kind of note it is, and it automatically
ends up in the right place. When the model is unsure, the system asks for a
quick confirmation instead of guessing.

## How it works

1. You enter a note (text) and specify which sprint it belongs to. An LLM
   can't reliably infer the sprint, so that stays manual input.
2. An LLM (via the Groq API) determines the **type** of the note, gives it a
   title and returns a confidence score (0-100). The available types are:
   - Expert Review
   - Retrospective
   - Framework/Techniek onderzoek (framework/technique research)
   - Meeting opdrachtgever (client meeting)
   - Overig (other)
3. Above the threshold (80% by default) the note is saved automatically to
   `notes/<sprint>/<type>/`.
4. Below the threshold the note goes into a review queue, where you confirm
   or correct the suggested type.
5. An overview shows all confirmed notes grouped by sprint, and by type
   within each sprint.

## Tech stack

- TypeScript + Node.js (run with `ts-node`)
- Express for the web UI and REST API
- Plain HTML, CSS and JavaScript frontend
- [Groq API](https://console.groq.com) for LLM classification
- Local filesystem (Markdown files + a JSON metadata file) for storage

## Installation

Requires Node.js 18 or newer (for the built-in `fetch`).

```bash
npm install
cp .env.example .env
# add your GROQ_API_KEY to .env (free key at console.groq.com)
```

## Usage

**Option 1: Web UI (recommended)**

```bash
npm run web
```

Open `http://localhost:3000` in your browser. A single page with:
- a form to enter a new note and sprint (classified immediately via Groq),
- a review queue for uncertain cases, with a dropdown to correct the type,
- a live overview of all confirmed notes per sprint and type.

**Option 2: Command line**

```bash
# Add a new note and classify it
npm run add-note -- path/to/note.txt "Sprint 4"

# Review uncertain notes (interactive in the terminal)
npm run review

# Overview of all confirmed notes per sprint and type
npm run overview
```

Both options use the same underlying logic (`src/classify.ts` and
`src/storage.ts`). The CLI is handy for quick scripts and automation, and the
web UI for everyday use.

## Project structure

```
src/
  classify.ts   LLM classification via the Groq API
  storage.ts    Saving, moving and querying notes on disk
  config.ts     Note types, confidence threshold, model and paths
  types.ts      Shared TypeScript types
  server.ts     Express server + REST API for the web UI
  index.ts      CLI: add a note
  review.ts     CLI: review uncertain notes
  overview.ts   CLI: print the overview
public/         Web UI (HTML, CSS, JS)
notes/          Generated: classified notes as Markdown (gitignored)
data/           Generated: metadata.json (gitignored)
```

## Design decisions

- **Sprint as manual input, type as AI classification.** The model can't
  reliably guess a sprint number from the text (unless it's mentioned
  literally), so that responsibility stays with the user. The type, on the
  other hand, can be inferred well from the content, so the model automates
  that.
- **A confidence threshold instead of always saving automatically.** This
  prevents misclassified notes from silently ending up in the wrong folder.
  The threshold can be configured in `src/config.ts`.
- **A fixed list of types instead of letting the model choose freely.** This
  prevents duplicate categories and makes the output predictable enough to
  process automatically. "Overig" (other) catches the exceptions.
- **Filesystem instead of a database.** At this scale (one student, not a
  company), a simple folder and JSON structure is easier to inspect and debug
  than a database, without losing any functionality.
