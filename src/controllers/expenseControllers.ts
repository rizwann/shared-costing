import { Request, Response } from "express";
import { get } from "lodash";
import Expense from "../models/Expense";
import User from "../models/User";

// Create a new expense
export const createExpense = async (req: Request, res: Response) => {
  try {
    const { store, cost, category, description, houseCode } = req.body;
    const userId = get(req, "identity._id") as unknown as string;

    const userHouses = await User.findById(userId).select("houseCodes");

    if (!userHouses?.houseCodes.includes(houseCode)) {
      return res
        .status(403)
        .json({ message: "Unauthorized, you are not a member of this house!" });
    }
    const date = new Date();

    const newExpense = new Expense({
      user: userId,
      store,
      cost,
      category,
      description,
      houseCode,
      date,
    });
    const savedExpense = await newExpense.save();

    res.status(201).json(savedExpense);
  } catch (error: any) {
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
    const { expenseId } = req.params;
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json(expense);
  } catch (error: any) {
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

// Update an expense by ID
export const updateExpense = async (req: Request, res: Response) => {
  try {
    const { expenseId } = req.params;
    const { cost, category, description } = req.body;

    const expense = await Expense.findByIdAndUpdate(
      expenseId,
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
    const { expenseId } = req.params;

    const expense = await Expense.findByIdAndRemove(expenseId);

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
    const { userId } = req.params;
    const currentUserId = get(req, "identity._id") as unknown as string;

    if (userId !== currentUserId.toString())
      return res
        .status(403)
        .json({ message: "Unauthorized, you only can access your expenses!" });

    const expenses = await Expense.find({ user: userId });

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
    const { userId, houseCode } = req.params;

    const expenses = await Expense.find({ user: userId, houseCode: houseCode });

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

//get all expenses by house
export const getAllExpensesByHouse = async (req: Request, res: Response) => {
  try {
    const { houseCode } = req.params;
    const expenses = await Expense.find({ houseCode: houseCode });

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

//get expense of current month by the user in a specific house

export const getExpensesOfCurrentMonthByUserInHouse = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId, houseCode } = req.params;
    console.log(houseCode);
    const expenses = await Expense.find({ user: userId, houseCode: houseCode });

    if (!expenses) {
      return res.status(404).json({ message: "Expenses not found" });
    }

    if (expenses.length === 0) {
      return res
        .status(200)
        .json({ message: "No expenses found for this user" });
    }

    const date = new Date();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    // check which expenses has date property
    // Todo: remove this after adding date property to all expenses
    const expensesWithDateProp = expenses.filter((expense) => expense.date);
    const expensesOfCurrentMonth = expensesWithDateProp.filter(
      (expense) =>
        expense.date.getMonth() === currentMonth &&
        expense.date.getFullYear() === currentYear
    );

    res.status(200).json(expensesOfCurrentMonth);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// get expense of current month by house
export const getExpensesOfHouseByCurrentMonth = async (
  req: Request,
  res: Response
) => {
  try {
    const { houseCode } = req.params;

    const expenses = await Expense.find({ houseCode: houseCode });

    if (!expenses) {
      return res.status(404).json({ message: "Expenses not found" });
    }

    if (expenses.length === 0) {
      return res
        .status(200)
        .json({ message: "No expenses found for this user" });
    }

    const date = new Date();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    // check which expenses has date property
    // Todo: remove this after adding date property to all expenses
    const expensesWithDateProp = expenses.filter((expense) => expense.date);
    const expensesOfCurrentMonth = expensesWithDateProp.filter(
      (expense) =>
        expense.date.getMonth() === currentMonth &&
        expense.date.getFullYear() === currentYear
    );

    res.status(200).json(expensesOfCurrentMonth);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// get expense of current year by the user in a specific house

export const getExpensesOfCurrentYearByUserInHouse = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId, houseCode } = req.params;
    const expenses = await Expense.find({ user: userId, houseCode: houseCode });

    if (!expenses) {
      return res.status(404).json({ message: "Expenses not found" });
    }

    if (expenses.length === 0) {
      return res
        .status(200)
        .json({ message: "No expenses found for this user" });
    }

    const date = new Date();
    const currentYear = date.getFullYear();
    // check which expenses has date property
    // Todo: remove this after adding date property to all expenses
    const expensesWithDateProp = expenses.filter((expense) => expense.date);

    const expensesOfCurrentYear = expensesWithDateProp.filter(
      (expense) => expense.date.getFullYear() === currentYear
    );

    res.status(200).json(expensesOfCurrentYear);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// get expense of a specific year by the user in a specific house
export const getExpensesOfSpecificYearByUserInHouse = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId, houseCode, year } = req.params;
    const expenses = await Expense.find({ user: userId, houseCode: houseCode });

    if (!expenses) {
      return res.status(404).json({ message: "Expenses not found" });
    }

    if (expenses.length === 0) {
      return res
        .status(200)
        .json({ message: "No expenses found for this user" });
    }
    // check which expenses has date property
    // Todo: remove this after adding date property to all expenses
    const expensesWithDateProp = expenses.filter((expense) => expense.date);
    const expensesOfSpecificYear = expensesWithDateProp.filter(
      (expense) => expense.date.getFullYear() === Number(year)
    );

    res.status(200).json(expensesOfSpecificYear);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
// get expense of a specific year in a specific house
export const getExpensesOfSpecificHouseByYear = async (
  req: Request,
  res: Response
) => {
  try {
    const { houseCode, year } = req.params;
    const expenses = await Expense.find({ houseCode: houseCode });

    if (!expenses) {
      return res.status(404).json({ message: "Expenses not found" });
    }

    if (expenses.length === 0) {
      return res
        .status(200)
        .json({ message: "No expenses found for this user" });
    }
    // check which expenses has date property
    // Todo: remove this after adding date property to all expenses
    const expensesWithDateProp = expenses.filter((expense) => expense.date);
    const expensesOfSpecificYear = expensesWithDateProp.filter(
      (expense) => expense.date.getFullYear() === Number(year)
    );
    if (expensesOfSpecificYear.length === 0) {
      return res.status(200).json({ message: "No expenses found for " + year });
    }

    res.status(200).json(expensesOfSpecificYear);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// get expenses of a specific month and year by the user in a specific house

export const getExpensesOfSpecificMonthAndYearByUserInHouse = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId, houseCode, month, year } = req.params;
    const expenses = await Expense.find({ user: userId, houseCode: houseCode });

    if (!expenses) {
      return res.status(404).json({ message: "Expenses not found" });
    }

    if (expenses.length === 0) {
      return res
        .status(200)
        .json({ message: "No expenses found for this user" });
    }
    // check which expenses has date property
    // Todo: remove this after adding date property to all expenses
    const expensesWithDateProp = expenses.filter((expense) => expense.date);
    const expensesOfSpecificMonthAndYear = expensesWithDateProp.filter(
      (expense) =>
        expense.date.getFullYear() === Number(year) &&
        expense.date.getMonth() === Number(month) - 1
    );

    res.status(200).json(expensesOfSpecificMonthAndYear);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//get expenses of a specific month and year in a specific house

export const getExpensesOfSpecificMonthAndYearByHouse = async (
  req: Request,
  res: Response
) => {
  try {
    const { houseCode, month, year } = req.params;
    const expenses = await Expense.find({ houseCode: houseCode });

    if (!expenses) {
      return res.status(404).json({ message: "Expenses not found" });
    }

    if (expenses.length === 0) {
      return res
        .status(200)
        .json({ message: "No expenses found for this user" });
    }
    // check which expenses has date property
    // Todo: remove this after adding date property to all expenses
    const expensesWithDateProp = expenses.filter((expense) => expense.date);
    const expensesOfSpecificMonthAndYear = expensesWithDateProp.filter(
      (expense) =>
        expense.date.getFullYear() === Number(year) &&
        expense.date.getMonth() === Number(month) - 1
    );

    if (expensesOfSpecificMonthAndYear.length === 0) {
      return res
        .status(200)
        .json({ message: "No expenses found for this month and year" });
    }

    res.status(200).json(expensesOfSpecificMonthAndYear);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
