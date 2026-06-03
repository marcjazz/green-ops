import type { Request, Response, NextFunction } from 'express';
import jwt, { type VerifyErrors } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: process.env.KEYCLOAK_JWKS_URI || 'http://keycloak:8080/realms/greenops/protocol/openid-connect/certs'
});

function getKey(header: any, callback: any) {
  if (!header || !header.kid) {
    return callback(new Error("Missing kid in JWT header"));
  }

  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error("Error getting signing key:", err);
      return callback(err);
    }
    if (!key) {
      console.error("No signing key found for kid:", header.kid);
      return callback(new Error("No signing key found"));
    }
    try {
      const signingKey = (key as any).getPublicKey();
      callback(null, signingKey);
    } catch (e: any) {
      console.error("Error extracting public key:", e.message);
      callback(e);
    }
  });
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  // Skip auth for health and metrics
  if (req.url === '/health' || req.url === '/metrics' || req.url === '/health/' || req.url === '/metrics/') {
    return next();
  }

  const authHeader = req.headers.authorization;
  console.log("Authenticating request:", req.method, req.url);

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error("Token missing from Authorization header");
      return res.status(401).json({ success: false, error: "Token missing" });
    }

    jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err: VerifyErrors | null, user: any) => {
      if (err) {
        console.error("JWT verification failed:", err.message);
        return res.status(403).json({ success: false, error: "Authentication failed", details: err.message });
      }
      console.log("JWT verified successfully for user:", user.sub);
      (req as any).user = user;
      next();
    });
  } else {
    console.warn("Authorization header missing");
    res.status(401).json({ success: false, error: "Authorization header missing" });
  }
};
