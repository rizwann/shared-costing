import { Request, Response } from "express";
import Expense from "../models/Expense";
import User from "../models/User";

// Create a new expense
export const createExpense = async (req: Request, res: Response) => {
  try {
    const { store, cost, category, description, houseCode } = req.body;

    const userId = req.session?.user?._id;

    const userHouses = await User.findById(userId).select("houseCodes");

    if (!userHouses?.houseCodes.includes(houseCode)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const newExpense = new Expense({
      user: userId,
      store,
      cost,
      category,
      description,
      houseCode,
    });
    const savedExpense = await newExpense.save();

    res.status(201).json(savedExpense);
  } catch (error: any) {
    console.error(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ message: `Invalid ${error.path}: ${error.value}` });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Get all expenses
export const getAllExpenses = async (req: Request, res: Response) => {
  try {
    const expenses = await Expense.find();
    res.status(200).json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a single expense by ID
export const getExpenseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update an expense by ID
export const updateExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cost, category, description } = req.body;

    const expense = await Expense.findByIdAndUpdate(
      id,
      { cost, category, description },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete an expense by ID
export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByIdAndRemove(id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// get all expenses by user, only accessible by that user
export const getAllExpensesByUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const expenses = await Expense.find({ user: id });

    if (!expenses) {
      return res.status(404).json({ message: "Expenses not found" });
    }

    if (expenses.length === 0) {
      return res
        .status(200)
        .json({ message: "No expenses found for this user" });
    }

    res.status(200).json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// get all expenses by user in a specific house, only accessible by that user

export const getAllExpensesByUserInHouse = async (
  req: Request,
  res: Response
) => {
  try {
    const { id, houseCode } = req.params;
    // const expenses = await Expense.find({ user: id, houseCode: houseCode });
    // here houseCode is a string and have to check if it is in the user's houseCodes array
    const expenses = await Expense.find({ user: id, houseCode: houseCode });

    if (!expenses) {
      return res.status(404).json({ message: "Expenses not found" });
    }

    if (expenses.length === 0) {
      return res
        .status(200)
        .json({ message: "No expenses found for this user" });
    }

    res.status(200).json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllExpensesByHouse = async (req: Request, res: Response) => {
  try {
    const { houseCode } = req.params;
    const expenses = await Expense.find({ houseCode: houseCode });

    //check if the current user has this houseCode in their houseCodes array
    const userId = req.session?.user?._id;
    const userHouses = await User.findById(userId).select("houseCodes");

    if (!userHouses?.houseCodes.includes(houseCode)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (!expenses) {
      return res.status(404).json({ message: "Expenses not found" });
    }

    if (expenses.length === 0) {
      return res
        .status(200)
        .json({ message: "No expenses found for this user" });
    }

    res.status(200).json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
