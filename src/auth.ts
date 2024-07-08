import express from "express";
import { env } from "./env";

export function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const key = req.header("vtar-key") ?? null;
  if (env.VTAR_KEY == null || key === env.VTAR_KEY) {
    next();
  } else {
    res.status(401).send("Unauthorized");
  }
}
