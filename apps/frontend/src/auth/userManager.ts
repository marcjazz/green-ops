import { UserManager } from "oidc-client-ts";

const oidcConfig = {
	authority: "https://accounts.greenops.local/realms/greenops",
	client_id: "greenops-frontend",
	redirect_uri: "https://greenops.local/",
	automaticSilentRenew: true,
	monitorSession: false,
	scope: "openid profile email",
};

export const userManager = new UserManager(oidcConfig);
