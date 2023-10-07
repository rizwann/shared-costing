// authMiddleware.ts

import { NextFunction, Request, Response } from "express";

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check if the user is authenticated by checking if the user object exists in the session
  if (req.session && req.session.user) {
    next(); // User is authenticated, proceed to the next middleware or route
  } else {
    res.status(401).json({ message: "Unauthorized" }); // User is not authenticated, send a 401 Unauthorized response
  }
};
