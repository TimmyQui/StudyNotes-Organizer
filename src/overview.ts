import { getConfirmedBySprint } from "./storage";

async function main() {
  const bySprint = await getConfirmedBySprint();
  const sprints = Object.keys(bySprint).sort();

  if (sprints.length === 0) {
    console.log("Nog geen bevestigde notities.");
    return;
  }

  for (const sprint of sprints) {
    console.log(`\n# ${sprint}`);
    const byType = bySprint[sprint];
    const types = Object.keys(byType).sort();

    for (const type of types) {
      const notes = byType[type].sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1
      );
      console.log(`\n  ## ${type} (${notes.length})`);
      for (const note of notes) {
        const date = note.createdAt.slice(0, 10);
        console.log(`    - [${date}] ${note.title}`);
      }
    }
  }
}

main().catch((err) => {
  console.error("Er ging iets mis:", err.message);
  process.exit(1);
});
