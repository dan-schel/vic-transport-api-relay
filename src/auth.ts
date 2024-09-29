import express from "express";
import { env } from "./env";

export function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const key = req.header("relay-key") ?? null;
  if (env.RELAY_KEY == null || key === env.RELAY_KEY) {
    next();
  } else {
    res.status(401).send("Unauthorized");
  }
}
