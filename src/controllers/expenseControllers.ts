import { Request, Response } from "express";
import Expense from "../models/Expense";
import Store from "../models/Store";
import { User } from "../models/User";

// Create a new expense
export const createExpense = async (req: Request, res: Response) => {
  try {
    const {
      storeId,
      cost,
      category,
      description,
      houseCode,
      userId,
      involvedUsers,
    } = req.body;

    const userHouses = await User.findById(userId).select("houseCodes");

    if (!userHouses?.houseCodes.includes(houseCode)) {
      return res
        .status(403)
        .json({ message: "Unauthorized, you are not a member of this house!" });
    }

    const foundStore = await Store.findById(storeId);
    if (!foundStore) {
      return res.status(404).json({ message: "Store not found" });
    }

    // check if the involved users are members of the house
    const users = await User.find({ houseCodes: houseCode });
    const usersIds = users.map((user) => user._id.toString());

    const involvedUsersIds = involvedUsers
      ? [...involvedUsers, userId]
      : usersIds;

    const isInvolvedUsersInHouse = involvedUsersIds?.every((id: string) =>
      usersIds.includes(id.toString())
    );
    if (!isInvolvedUsersInHouse) {
      return res
        .status(403)
        .json({ message: "Unauthorized, involved users are not in the house" });
    }
    const date = new Date();
    //Germany time zone
    date.setHours(date.getHours() + 1);

    const newExpense = new Expense({
      user: userId,
      storeId,
      cost,
      category,
      description,
      houseCode,
      date,
      storeName: foundStore.name ? foundStore.name : "",
      storeImg: foundStore.image ? foundStore.image : "",
      involvedUsers: involvedUsersIds,
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
    const { cost, category, description, involvedUsers } = req.body;

    const expense = await Expense.findByIdAndUpdate(
      expenseId,
      { cost, category, description, involvedUsers },
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
    const currentUserId = req.body.userId;

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

    const { last } = req.query;

    const expenses = await Expense.find({ user: userId, houseCode })
      .sort({ date: -1 })
      .limit(last ? Number(last) : 0);

    if (!expenses) {
      return res.status(404).json({ message: "Expenses not found" });
    }

    if (expenses.length === 0) {
      return res
        .status(200)
        .json({ message: "No expenses found for this user" });
    }

    res.status(200).json({ count: expenses.length, expenses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//get all expenses by house

//get expense of current month by the user in a specific house

export const getExpensesOfCurrentMonthByUserInHouse = async (
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
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    const expensesOfCurrentMonth = expenses.filter(
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

//get expense of current week by the user in a specific house
export const getExpensesOfCurrentWeekByUserInHouse = async (
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

    const currentDate = new Date();
    const currentWeekStartDate = new Date(currentDate);
    currentWeekStartDate.setHours(0, 0, 0, 0);
    currentWeekStartDate.setDate(
      currentWeekStartDate.getDate() - currentDate.getDay()
    ); // Set to the start of the week (Sunday).

    const currentWeekEndDate = new Date(currentWeekStartDate);
    currentWeekEndDate.setDate(currentWeekEndDate.getDate() + 7); // End of the week (next Sunday).

    const expensesOfCurrentWeek = expenses.filter(
      (expense) =>
        expense.date >= currentWeekStartDate &&
        expense.date < currentWeekEndDate
    );

    res.status(200).json(expensesOfCurrentWeek);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// get expense of current month by house
export const getExpensesOfHouse = async (req: Request, res: Response) => {
  try {
    const { houseCode } = req.params;
    const { currentMonth, lastMonth } = req.query;

    const expenses = await Expense.find({ houseCode: houseCode });

    if (expenses.length === 0) {
      return res
        .status(404)
        .json({ message: "No expenses found for this user" });
    }

    const totalExpenses = Number(
      expenses.reduce((total, expense) => total + expense.cost, 0).toFixed(2)
    );

    const date = new Date();
    const thisMonth = date.getMonth();
    const currentYear = date.getFullYear();
    let prevMonth = date.getMonth() - 1;
    let prevYear = date.getFullYear();
    if (prevMonth < 0) {
      prevYear -= 1;
      prevMonth = 11; // December
    }

    const expensesOfthisMonth = expenses.filter(
      (expense) =>
        expense.date.getMonth() === thisMonth &&
        expense.date.getFullYear() === currentYear
    );

    const totalExpensesThisMonth = Number(
      expensesOfthisMonth
        .reduce((total, expense) => total + expense.cost, 0)
        .toFixed(2)
    );

    const expensesOfLastMonth = expenses.filter(
      (expense) =>
        expense.date.getMonth() === prevMonth &&
        expense.date.getFullYear() === prevYear
    );

    const totalExpensesLastMonth = Number(
      expensesOfLastMonth
        .reduce((total, expense) => total + expense.cost, 0)
        .toFixed(2)
    );

    res.status(200).json(
      currentMonth === "true"
        ? {
            totalExpenses: totalExpensesThisMonth,
            expenses: expensesOfthisMonth,
          }
        : lastMonth === "true"
        ? {
            totalExpenses: totalExpensesLastMonth,
            expenses: expensesOfLastMonth,
          }
        : { totalExpenses, expenses }
    );
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

export const calculateHouseExpensesAndDebts = async (
  req: Request,
  res: Response
) => {
  try {
    const { houseCode, month, year } = req.params;

    // Find all expenses for the given house
    const allExpenses = await Expense.find({ houseCode });
    const date = new Date();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();

    // check which expenses have the date property
    const expenses =
      month && year
        ? allExpenses.filter(
            (expense) =>
              expense.date.getFullYear() === Number(year) &&
              expense.date.getMonth() === Number(month) - 1
          )
        : allExpenses.filter(
            (expense) =>
              expense.date.getMonth() === currentMonth &&
              expense.date.getFullYear() === currentYear
          );

    // Find all users in the house
    const houseMembers = await User.find({ houseCodes: houseCode });

    if (!expenses || !houseMembers) {
      return res
        .status(404)
        .json({ message: "Data not found for the given house" });
    }

    // Calculate the total monthly cost
    let totalMonthlyCost = expenses.reduce(
      (total, expense) => total + expense.cost,
      0
    );
    totalMonthlyCost = Number(totalMonthlyCost.toFixed(2));

    // Calculate the share per member
    let equalShare = totalMonthlyCost / houseMembers.length;

    equalShare = Number(equalShare.toFixed(2));

    const payments = {} as Record<string, number>;

    // Calculate the actual expenses by each user
    const actualCostByUser: { [username: string]: number } = {};
    // Calculate user's expenses for the month by iterating over house members and matching the user id with the expense user id
    houseMembers.forEach((user) => {
      const userExpenses = expenses.filter(
        (expense) => expense.user.toString() === user._id.toString()
      );
      let userTotalExpense = 0;
      userExpenses.forEach((expense) => {
        userTotalExpense += expense.cost;
      });
      actualCostByUser[user.username] = userTotalExpense;
    });

    // Calculate payments
    for (const member of houseMembers) {
      let balance = equalShare - actualCostByUser[member.username];
      payments[member.username] = Number(balance.toFixed(2));
    }

    // Initialize an object to store payment instructions
    const paymentsCopy = { ...payments };

    // Initialize an object to store payment instructions

    const paymentInstructions: Record<string, Record<string, number>> = {};

    // Determine payments between members
    for (const payee of houseMembers) {
      paymentInstructions[payee.username] = {};
      for (const payer of houseMembers) {
        if (payee.username !== payer.username) {
          const amount =
            paymentsCopy[payee.username] > 0
              ? Math.min(
                  paymentsCopy[payee.username],
                  -paymentsCopy[payer.username]
                )
              : 0;
          paymentInstructions[payee.username][payer.username] = amount;
          paymentsCopy[payee.username] -= amount;
          paymentsCopy[payer.username] += amount;
        }
      }
    }

    // Prepare and send the response

    const response = {
      totalMonthlyCost,
      equalShare,
      userBalance: payments,
      actualCostByUser,
      paymentInstructions,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const calculateHouseExpensesAndDebtsNew = async (
  req: Request,
  res: Response
) => {
  try {
    const { houseCode, month, year } = req.params;

    // Find all expenses for the given house
    const allExpenses = await Expense.find({ houseCode });
    const date = new Date();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();

    // check which expenses have the date property
    const expenses =
      month && year
        ? allExpenses.filter(
            (expense) =>
              expense.date.getFullYear() === Number(year) &&
              expense.date.getMonth() === Number(month) - 1
          )
        : allExpenses.filter(
            (expense) =>
              expense.date.getMonth() === currentMonth &&
              expense.date.getFullYear() === currentYear
          );

    // Find all users in the house
    const houseMembers = await User.find({ houseCodes: houseCode });

    if (!expenses || !houseMembers) {
      return res
        .status(404)
        .json({ message: "Data not found for the given house" });
    }

    // Calculate the total monthly cost
    let totalMonthlyCost = expenses.reduce(
      (total, expense) => total + expense.cost,
      0
    );
    totalMonthlyCost = Number(totalMonthlyCost.toFixed(2));

    // Calculate the share per member
    let equalShare = totalMonthlyCost / houseMembers.length;

    equalShare = Number(equalShare.toFixed(2));

    const payments = {} as Record<string, number>;

    // Calculate the actual expenses by each user
    const actualCostByUser: { [username: string]: number } = {};
    // Calculate user's expenses for the month by iterating over house members and matching the user id with the expense user id
    houseMembers.forEach((user) => {
      const userExpenses = expenses.filter(
        (expense) => expense.user.toString() === user._id.toString()
      );
      let userTotalExpense = 0;
      userExpenses.forEach((expense) => {
        userTotalExpense += expense.cost;
      });
      actualCostByUser[user.username] = userTotalExpense;
    });

    const userInvolvedInExpenses: { [username: string]: number } = {};

    houseMembers.forEach((user) => {
      const userInvolvedExpenses = expenses.filter((expense) =>
        expense.involvedUsers.includes(user._id.toString())
      );
      let totalInvolvedExpense = 0;
      userInvolvedExpenses.forEach((expense) => {
        totalInvolvedExpense += expense.cost;
      });
      userInvolvedInExpenses[user.username] = totalInvolvedExpense;
    });
    const newBalance: { [username: string]: number } = {};

    //compare userInvolvedInExpenses with actualCostByUser and make newBalance

    for (const member of houseMembers) {
      newBalance[member.username] =
        actualCostByUser[member.username] -
        userInvolvedInExpenses[member.username];
    }

    // Calculate payments
    for (const member of houseMembers) {
      let balance = equalShare - actualCostByUser[member.username];
      payments[member.username] = Number(balance.toFixed(2));
    }

    // Initialize an object to store payment instructions
    const paymentsCopy = { ...payments };

    // Initialize an object to store payment instructions

    const paymentInstructions: Record<string, Record<string, number>> = {};

    // Determine payments between members
    for (const payee of houseMembers) {
      paymentInstructions[payee.username] = {};
      for (const payer of houseMembers) {
        if (payee.username !== payer.username) {
          const amount =
            paymentsCopy[payee.username] > 0
              ? Math.min(
                  paymentsCopy[payee.username],
                  -paymentsCopy[payer.username]
                )
              : 0;
          paymentInstructions[payee.username][payer.username] = amount;
          paymentsCopy[payee.username] -= amount;
          paymentsCopy[payer.username] += amount;
        }
      }
    }

    // Prepare and send the response

    const response = {
      totalMonthlyCost,
      equalShare,
      userBalance: payments,
      actualCostByUser,
      paymentInstructions,
      userInvolvedInExpenses,
      newBalance,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
