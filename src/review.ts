import * as readline from "readline";
import { TYPES } from "./config";
import { getPendingReview, confirmType } from "./storage";

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  const pending = await getPendingReview();

  if (pending.length === 0) {
    console.log("Niets te reviewen — alles staat al met hoge confidence.");
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(`${pending.length} notitie(s) wachten op review.\n`);

  for (const note of pending) {
    console.log("─".repeat(50));
    console.log(`Sprint:     ${note.sprint}`);
    console.log(`Titel:      ${note.title}`);
    console.log(`Voorstel:   ${note.type} (confidence: ${note.confidence}%)`);
    console.log(`Reden:      ${note.reasoning}`);
    console.log(`Tekst:      ${note.originalText.slice(0, 120)}...`);
    console.log("\nTypes:");
    TYPES.forEach((t: string, i: number) => console.log(`  ${i + 1}. ${t}`));

    const answer = await ask(
      rl,
      `\nKies een nummer (Enter = akkoord met "${note.type}"): `
    );

    const chosenType = answer.trim()
      ? TYPES[parseInt(answer.trim(), 10) - 1] ?? note.type
      : note.type;

    await confirmType(note.id, chosenType);
    console.log(`Bevestigd als: ${chosenType}\n`);
  }

  rl.close();
  console.log("Klaar met reviewen!");
}

main().catch((err) => {
  console.error("Er ging iets mis:", err.message);
  process.exit(1);
});
