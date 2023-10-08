// authMiddleware.ts

import { NextFunction, Request, Response } from "express";
import Expense from "../models/Expense";

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check if the user is authenticated by checking if the user object exists in the session
  if (req.session && req.session.user) {
    next(); // User is authenticated, proceed to the next middleware or route
  } else {
    res.status(401).json({ message: "Unauthenticated" }); // User is not authenticated, send a 401 Unauthorized response
  }
};

export const checkExpenseOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Check if the user requesting the action is the owner
    if (String(expense.user) !== String(req.session?.user?._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkExpensesOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const user = String(req.session?.user?._id) === String(id);

    if (!user) {
      return res.status(403).json({ message: "User not Authorized" });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
