import { UserManager } from 'oidc-client-ts';

const oidcConfig = {
  authority: 'https://accounts.greenops.local/realms/greenops',
  client_id: 'greenops-frontend',
  redirect_uri: 'https://greenops.local/',
  automaticSilentRenew: true,
  monitorSession: false, // Disables the problematic 3rd-party cookie iframe
};

export const userManager = new UserManager(oidcConfig);
