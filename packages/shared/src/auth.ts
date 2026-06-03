import type { Request, Response, NextFunction } from 'express';
import jwt, { type VerifyErrors } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: process.env.KEYCLOAK_JWKS_URI || 'http://keycloak:8080/realms/master/protocol/openid-connect/certs'
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error("Error getting signing key:", err);
      return callback(err);
    }
    const signingKey = (key as any).getPublicKey();
    callback(null, signingKey);
  });
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token || '', getKey, { algorithms: ['RS256'] }, (err: VerifyErrors | null, user: any) => {
      if (err) {
        console.error("JWT verification failed:", err.message);
        return res.sendStatus(403);
      }
      (req as any).user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};
