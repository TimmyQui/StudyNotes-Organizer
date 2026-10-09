import { promises as fs } from "fs";
import { classifyNote } from "./classify";
import { saveNote } from "./storage";

async function main() {
  const filePath = process.argv[2];
  const sprint = process.argv[3];

  if (!filePath || !sprint) {
    console.error(
      'Gebruik: npx ts-node src/index.ts <pad-naar-notitie.txt> "<sprint>"'
    );
    console.error('Bijvoorbeeld: npx ts-node src/index.ts notitie.txt "Sprint 4"');
    process.exit(1);
  }

  const noteText = await fs.readFile(filePath, "utf-8");

  console.log(`Notitie wordt geclassificeerd voor ${sprint}...`);
  const result = await classifyNote(noteText);

  console.log("\nResultaat:");
  console.log(`  Sprint:     ${sprint}`);
  console.log(`  Type:       ${result.type}`);
  console.log(`  Titel:      ${result.title}`);
  console.log(`  Confidence: ${result.confidence}%`);
  console.log(`  Reden:      ${result.reasoning}`);

  const saved = await saveNote(noteText, sprint, result);

  if (saved.reviewed) {
    console.log(`\nAutomatisch opgeslagen: ${saved.filePath}`);
  } else {
    console.log(
      `\nLage confidence — opgeslagen maar wacht op review: ${saved.filePath}`
    );
    console.log("   Run 'npx ts-node src/review.ts' om te reviewen.");
  }
}

main().catch((err) => {
  console.error("Er ging iets mis:", err.message);
  process.exit(1);
});
