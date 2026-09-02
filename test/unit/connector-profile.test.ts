import { describe, expect, it } from "vitest";

import {
  createTeamsRegistrationPreview,
  githubHostedPublicUrls,
  githubConnectorProfile,
  validateConnectorProfile
} from "../../src/connector-profile.js";

describe("githubConnectorProfile", () => {
  it("accepts the intended read-only GitHub and Teams configuration", () => {
    expect(() => validateConnectorProfile(githubConnectorProfile)).not.toThrow();
  });

  it("renders a registration preview without storing a client secret", () => {
    const preview = createTeamsRegistrationPreview();

    expect(preview.teamsOAuthRegistration.baseUrl).toBe(
      "https://api.githubcopilot.com/mcp/readonly"
    );
    expect(JSON.stringify(preview)).not.toContain("client_secret");
    expect(preview.githubApp.installationTarget).toBe("personal-account");
    expect(preview.githubApp.repositoryPermissions).toContainEqual({
      name: "contents",
      level: "read"
    });
  });

  it("renders live GitHub-hosted legal document URLs", () => {
    const preview = createTeamsRegistrationPreview();
    expect(preview.microsoft365Connector.websiteUrl).toBe(githubHostedPublicUrls.website);
    expect(preview.microsoft365Connector.privacyPolicyUrl).toBe(
      githubHostedPublicUrls.privacyPolicy
    );
    expect(preview.microsoft365Connector.termsOfUseUrl).toBe(githubHostedPublicUrls.termsOfUse);
  });

  it.each([
    [
      "an MCP endpoint that permits writes",
      (profile: typeof githubConnectorProfile) => {
        profile.mcp.endpoint = "https://api.githubcopilot.com/mcp";
      },
      "mcp.endpoint must be https://api.githubcopilot.com/mcp/readonly"
    ],
    [
      "an insecure MCP endpoint",
      (profile: typeof githubConnectorProfile) => {
        profile.mcp.endpoint = "http://api.githubcopilot.com/mcp/readonly";
      },
      "mcp.endpoint must use HTTPS"
    ],
    [
      "a non-Teams callback URL",
      (profile: typeof githubConnectorProfile) => {
        profile.oauth.redirectUri = "https://example.test/callback";
      },
      "oauth.redirectUri must be https://teams.microsoft.com/api/platform/v1.0/oAuthRedirect"
    ],
    [
      "disabled PKCE",
      (profile: typeof githubConnectorProfile) => {
        profile.oauth.pkceEnabled = false;
      },
      "oauth.pkceEnabled must be true"
    ],
    [
      "classic OAuth scopes",
      (profile: typeof githubConnectorProfile) => {
        profile.oauth.scopes.push("repo");
      },
      "oauth.scopes must be empty"
    ],
    [
      "all-repository installation access",
      (profile: typeof githubConnectorProfile) => {
        profile.githubApp.repositorySelection = "all";
      },
      "githubApp.repositorySelection must be selected"
    ],
    [
      "an organization installation target",
      (profile: typeof githubConnectorProfile) => {
        profile.githubApp.installationTarget = "organization";
      },
      "githubApp.installationTarget must be personal-account"
    ],
    [
      "a write permission",
      (profile: typeof githubConnectorProfile) => {
        profile.githubApp.repositoryPermissions[0]!.level = "write";
      },
      "must not grant write access"
    ]
  ])("rejects %s", (_description, mutateProfile, expectedError) => {
    const invalidProfile = structuredClone(githubConnectorProfile);
    mutateProfile(invalidProfile);

    expect(() => validateConnectorProfile(invalidProfile)).toThrow(expectedError);
  });

});
