export const GITHUB_MCP_READONLY_ENDPOINT = "https://api.githubcopilot.com/mcp/readonly";
export const GITHUB_OAUTH_AUTHORIZE_ENDPOINT = "https://github.com/login/oauth/authorize";
export const GITHUB_OAUTH_TOKEN_ENDPOINT = "https://github.com/login/oauth/access_token";
export const TEAMS_OAUTH_REDIRECT_URI =
  "https://teams.microsoft.com/api/platform/v1.0/oAuthRedirect";
export const DEFAULT_MCP_PROTOCOL_VERSION = "2025-06-18";

export type GitHubPermissionLevel = "read" | "write";
export type RepositorySelection = "selected" | "all";
export type InstallationTarget = "personal-account" | "organization";

export interface GitHubAppPermission {
  name: string;
  level: GitHubPermissionLevel;
}

export interface OAuthConfiguration {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  refreshEndpoint: string;
  redirectUri: string;
  pkceEnabled: boolean;
  scopes: string[];
}

export interface McpToolRequirement {
  name: string;
  requiredInputProperties: string[];
}

export interface McpConfiguration {
  endpoint: string;
  requiredTools: McpToolRequirement[];
  forbiddenTools: string[];
}

export interface GitHubAppConfiguration {
  installationTarget: InstallationTarget;
  repositorySelection: RepositorySelection;
  userAccessTokenExpirationEnabled: boolean;
  repositoryPermissions: GitHubAppPermission[];
}

export interface PublicUrls {
  website: string;
  privacyPolicy: string;
  termsOfUse: string;
}

export interface ConnectorProfile {
  displayName: string;
  developerName: string;
  publicUrls: PublicUrls;
  mcp: McpConfiguration;
  oauth: OAuthConfiguration;
  githubApp: GitHubAppConfiguration;
}

export const githubHostedPublicUrls: PublicUrls = {
  website: "https://github.com/felipeneivadc/custom-federated-connector-github",
  privacyPolicy:
    "https://github.com/felipeneivadc/custom-federated-connector-github/blob/main/docs/privacy-policy.md",
  termsOfUse:
    "https://github.com/felipeneivadc/custom-federated-connector-github/blob/main/docs/terms-of-use.md"
};

export interface ConnectorRegistrationPreview {
  teamsOAuthRegistration: {
    name: string;
    baseUrl: string;
    restrictUsageByOrganization: "My organization only";
    restrictUsageByApp: "Any Teams app";
    authorizationEndpoint: string;
    tokenEndpoint: string;
    refreshEndpoint: string;
    scopes: string[];
    pkceEnabled: boolean;
    clientIdSource: "GitHub App client ID";
    clientSecretSource: "GitHub App client secret";
  };
  microsoft365Connector: {
    displayName: string;
    developerName: string;
    baseUrl: string;
    websiteUrl: string;
    privacyPolicyUrl: string;
    termsOfUseUrl: string;
    authentication: "OAuth client registration ID generated in Teams Developer Portal";
  };
  githubApp: {
    callbackUrl: string;
    installationTarget: InstallationTarget;
    repositorySelection: RepositorySelection;
    repositoryPermissions: GitHubAppPermission[];
    userAccessTokenExpirationEnabled: boolean;
  };
}

export class ConnectorProfileValidationError extends Error {
  constructor(readonly errors: string[]) {
    super(`Connector profile is invalid:\n- ${errors.join("\n- ")}`);
    this.name = "ConnectorProfileValidationError";
  }
}

export const githubConnectorProfile: ConnectorProfile = {
  displayName: "GitHub Conector",
  developerName: "Felipe Neiva",
  publicUrls: githubHostedPublicUrls,
  mcp: {
    endpoint: GITHUB_MCP_READONLY_ENDPOINT,
    requiredTools: [
      {
        name: "get_file_contents",
        requiredInputProperties: ["owner", "repo"]
      },
      {
        name: "list_issues",
        requiredInputProperties: ["owner", "repo"]
      },
      {
        name: "issue_read",
        requiredInputProperties: ["method", "owner", "repo", "issue_number"]
      },
      {
        name: "list_pull_requests",
        requiredInputProperties: ["owner", "repo"]
      },
      {
        name: "pull_request_read",
        requiredInputProperties: ["method", "owner", "repo", "pullNumber"]
      }
    ],
    forbiddenTools: [
      "add_comment_to_pending_review",
      "add_issue_comment",
      "create_branch",
      "create_issue",
      "create_or_update_file",
      "create_pull_request",
      "create_repository",
      "delete_file",
      "delete_repository",
      "fork_repository",
      "issue_write",
      "merge_pull_request",
      "push_files",
      "update_issue",
      "update_pull_request"
    ]
  },
  oauth: {
    authorizationEndpoint: GITHUB_OAUTH_AUTHORIZE_ENDPOINT,
    tokenEndpoint: GITHUB_OAUTH_TOKEN_ENDPOINT,
    refreshEndpoint: GITHUB_OAUTH_TOKEN_ENDPOINT,
    redirectUri: TEAMS_OAUTH_REDIRECT_URI,
    pkceEnabled: true,
    scopes: []
  },
  githubApp: {
    installationTarget: "personal-account",
    repositorySelection: "selected",
    userAccessTokenExpirationEnabled: true,
    repositoryPermissions: [
      {
        name: "contents",
        level: "read"
      },
      {
        name: "issues",
        level: "read"
      },
      {
        name: "metadata",
        level: "read"
      },
      {
        name: "pull_requests",
        level: "read"
      }
    ]
  }
};

const REQUIRED_REPOSITORY_PERMISSIONS = new Set([
  "contents",
  "issues",
  "metadata",
  "pull_requests"
]);

export function validateConnectorProfile(profile: ConnectorProfile): void {
  const errors: string[] = [];

  if (profile.displayName.trim().length === 0) {
    errors.push("displayName must not be empty");
  }

  if (profile.developerName.trim().length === 0) {
    errors.push("developerName must not be empty");
  }

  validatePublicUrls(profile.publicUrls, errors);

  if (profile.mcp.endpoint !== GITHUB_MCP_READONLY_ENDPOINT) {
    errors.push(`mcp.endpoint must be ${GITHUB_MCP_READONLY_ENDPOINT}`);
  }

  validateHttpsUrl(profile.mcp.endpoint, "mcp.endpoint", errors);

  if (!hasReadonlyPath(profile.mcp.endpoint)) {
    errors.push("mcp.endpoint must use the read-only endpoint");
  }

  validateExactUrl(
    profile.oauth.authorizationEndpoint,
    GITHUB_OAUTH_AUTHORIZE_ENDPOINT,
    "oauth.authorizationEndpoint",
    errors
  );
  validateExactUrl(
    profile.oauth.tokenEndpoint,
    GITHUB_OAUTH_TOKEN_ENDPOINT,
    "oauth.tokenEndpoint",
    errors
  );
  validateExactUrl(
    profile.oauth.refreshEndpoint,
    GITHUB_OAUTH_TOKEN_ENDPOINT,
    "oauth.refreshEndpoint",
    errors
  );
  validateExactUrl(profile.oauth.redirectUri, TEAMS_OAUTH_REDIRECT_URI, "oauth.redirectUri", errors);

  if (!profile.oauth.pkceEnabled) {
    errors.push("oauth.pkceEnabled must be true");
  }

  if (profile.oauth.scopes.length !== 0) {
    errors.push("oauth.scopes must be empty because GitHub App user tokens use permissions");
  }

  if (profile.githubApp.repositorySelection !== "selected") {
    errors.push("githubApp.repositorySelection must be selected");
  }

  if (profile.githubApp.installationTarget !== "personal-account") {
    errors.push("githubApp.installationTarget must be personal-account");
  }

  if (!profile.githubApp.userAccessTokenExpirationEnabled) {
    errors.push("githubApp.userAccessTokenExpirationEnabled must be true");
  }

  const configuredPermissions = new Map(
    profile.githubApp.repositoryPermissions.map((permission) => [permission.name, permission.level])
  );

  for (const requiredPermission of REQUIRED_REPOSITORY_PERMISSIONS) {
    if (configuredPermissions.get(requiredPermission) !== "read") {
      errors.push(`githubApp.repositoryPermissions.${requiredPermission} must be read`);
    }
  }

  for (const permission of profile.githubApp.repositoryPermissions) {
    if (!REQUIRED_REPOSITORY_PERMISSIONS.has(permission.name)) {
      errors.push(`githubApp.repositoryPermissions.${permission.name} is not allowed`);
    }

    if (permission.level !== "read") {
      errors.push(`githubApp.repositoryPermissions.${permission.name} must not grant write access`);
    }
  }

  if (profile.mcp.requiredTools.length === 0) {
    errors.push("mcp.requiredTools must not be empty");
  }

  if (profile.mcp.forbiddenTools.length === 0) {
    errors.push("mcp.forbiddenTools must not be empty");
  }

  if (errors.length > 0) {
    throw new ConnectorProfileValidationError(errors);
  }
}

export function createTeamsRegistrationPreview(
  profile: ConnectorProfile = githubConnectorProfile
): ConnectorRegistrationPreview {
  validateConnectorProfile(profile);

  return {
    teamsOAuthRegistration: {
      name: `${profile.displayName} OAuth`,
      baseUrl: profile.mcp.endpoint,
      restrictUsageByOrganization: "My organization only",
      restrictUsageByApp: "Any Teams app",
      authorizationEndpoint: profile.oauth.authorizationEndpoint,
      tokenEndpoint: profile.oauth.tokenEndpoint,
      refreshEndpoint: profile.oauth.refreshEndpoint,
      scopes: [...profile.oauth.scopes],
      pkceEnabled: profile.oauth.pkceEnabled,
      clientIdSource: "GitHub App client ID",
      clientSecretSource: "GitHub App client secret"
    },
    microsoft365Connector: {
      displayName: profile.displayName,
      developerName: profile.developerName,
      baseUrl: profile.mcp.endpoint,
      websiteUrl: profile.publicUrls.website,
      privacyPolicyUrl: profile.publicUrls.privacyPolicy,
      termsOfUseUrl: profile.publicUrls.termsOfUse,
      authentication: "OAuth client registration ID generated in Teams Developer Portal"
    },
    githubApp: {
      callbackUrl: profile.oauth.redirectUri,
      installationTarget: profile.githubApp.installationTarget,
      repositorySelection: profile.githubApp.repositorySelection,
      repositoryPermissions: profile.githubApp.repositoryPermissions.map((permission) => ({
        ...permission
      })),
      userAccessTokenExpirationEnabled: profile.githubApp.userAccessTokenExpirationEnabled
    }
  };
}

function validatePublicUrls(publicUrls: PublicUrls, errors: string[]): void {
  validateHttpsUrl(publicUrls.website, "publicUrls.website", errors);
  validateHttpsUrl(publicUrls.privacyPolicy, "publicUrls.privacyPolicy", errors);
  validateHttpsUrl(publicUrls.termsOfUse, "publicUrls.termsOfUse", errors);
}

function validateExactUrl(value: string, expected: string, label: string, errors: string[]): void {
  validateHttpsUrl(value, label, errors);

  if (value !== expected) {
    errors.push(`${label} must be ${expected}`);
  }
}

function validateHttpsUrl(value: string, label: string, errors: string[]): void {
  try {
    if (new URL(value).protocol !== "https:") {
      errors.push(`${label} must use HTTPS`);
    }
  } catch {
    errors.push(`${label} must be a valid URL`);
  }
}

function hasReadonlyPath(value: string): boolean {
  try {
    return new URL(value).pathname.replace(/\/+$/, "").endsWith("/readonly");
  } catch {
    return false;
  }
}
