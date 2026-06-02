import { UserManager } from 'oidc-client-ts';

const oidcConfig = {
  authority: 'http://accounts.greenops.local/realms/greenops',
  client_id: 'greenops-frontend',
  redirect_uri: 'http://greenops.local/',
};

export const userManager = new UserManager(oidcConfig);
