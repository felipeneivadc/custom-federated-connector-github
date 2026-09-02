import {
  createTeamsRegistrationPreview,
  githubConnectorProfile,
  validateConnectorProfile
} from "./connector-profile.js";

function run(): void {
  const [command] = process.argv.slice(2);

  if (command === "validate") {
    validateConnectorProfile(githubConnectorProfile);
    console.log("Connector profile is valid.");
    return;
  }

  if (command === "registration") {
    const preview = createTeamsRegistrationPreview();
    console.log(JSON.stringify(preview, null, 2));
    return;
  }

  throw new Error("Usage: tsx src/cli.ts <validate|registration>");
}

try {
  run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
}
