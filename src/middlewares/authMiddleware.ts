// authMiddleware.ts

import { NextFunction, Request, Response } from "express";
import Expense from "../models/Expense";
import User from "../models/User";

export const checkExpenseOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { expenseId } = req.params;
    const { userId } = req.body;
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found lah" });
    }

    // Check if the user requesting the action is the owner
    if (String(expense.user) !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized, you only can access your expenses!" });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkExpensesOwnershipAndHouseOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, houseCode } = req.params;

    const userHouses = await User.findById(userId).select("houseCodes");

    if (!userHouses?.houseCodes.includes(houseCode)) {
      return res
        .status(403)
        .json({ message: "Unauthorized, you are not a member of this house" });
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkHouseOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { houseCode } = req.params;

    const { userId } = req.body;

    const userHouses = await User.findById(userId).select("houseCodes");

    if (!userHouses?.houseCodes.includes(houseCode)) {
      return res
        .status(403)
        .json({ message: "Unauthorized, you are not a member of this house" });
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
