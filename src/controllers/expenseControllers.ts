import { Request, Response } from "express";
import Expense from "../models/Expense";
import Store from "../models/Store";
import { User } from "../models/User";
import { Expense as IExpense } from "../../types";
import House from "../models/House";

// Create a new expense
export const createExpense = async (req: Request, res: Response) => {
  try {
    const {
      storeName,
      cost,
      category,
      description,
      houseCode,
      userId,
      paymentPerson,
      involvedUsers,
    } = req.body;
    const receipt = req.file ? req.file.path : undefined;
    console.log("receipt", receipt)
    const userForPayment = paymentPerson ? paymentPerson : userId
    const userHouses = await User.findById(userForPayment).select("houseCodes");
    const user = await User.findById(userForPayment);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!userHouses?.houseCodes.includes(houseCode)) {
      return res
        .status(403)
        .json({ message: "Unauthorized, the paying person is not a member of this house!" });
    }

    // const foundStore = await Store.findById(storeId);
    // if (!foundStore) {
    //   return res.status(404).json({ message: "Store not found" });
    // }

    // check if the involved users are members of the house
    const users = await User.find({ houseCodes: houseCode });
    const usernames = users.map((user) => user.username);

    const involvedUsersNames = involvedUsers
      ? [...involvedUsers]
      : usernames;

    const isInvolvedUsersInHouse = involvedUsersNames.every((user) =>
      usernames.includes(user)
    );
    if (!isInvolvedUsersInHouse) {
      return res
        .status(403)
        .json({ message: "Unauthorized, involved users are not in the house" });
    }
    const date = new Date();
    // to Germany local time
    const houseName = await House.findOne({ code: houseCode })
    const newExpense = new Expense({
      user: user.username,
      userId: user._id,
      cost,
      category,
      description,
      houseCode,
      houseName: houseName?.description,
      date: req.body.date ? new Date(req.body.date) : date,
      storeName,
      receipt: receipt ? receipt : undefined,
      involvedUsers: [...new Set(involvedUsersNames)],
      entryBy: userId,
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
    const { cost, category, description, involvedUsers, storeName } = req.body;
    const receipt = req.file ? req.file.path : undefined;
   
   
    // if (storeId) {
    //   const foundStore = await Store.findById(storeId);
    //   if (!foundStore) {
    //     return res.status(404).json({ message: "Store not found" });
    //   }
    console.log("receipt", receipt)

      const updatedExpense = await Expense.findByIdAndUpdate(
        expenseId,
        { cost, category, description, involvedUsers, storeName, receipt },
        { new: true }
      );
    // } else {
    //    updatedExpense = await Expense.findByIdAndUpdate(
    //     expenseId,
    //     { cost, category, description, involvedUsers },
    //     { new: true }
    //   );
    // }
    

    if (!updatedExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json(updatedExpense);
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
    const expenses = await Expense.find({ userId: userId });

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
    const expenses = await Expense.find({ houseCode: houseCode })
      .sort({ date: -1 });

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
        : expenses 
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
          function calculateBalances(expenses: IExpense[]): Record<string, number> {
            const balances: Record<string, number> = {};
        
            expenses.forEach(({ user, cost, involvedUsers }) => {
                const share = cost / involvedUsers.length;
        
                balances[user] = (balances[user] || 0) + cost;
                involvedUsers.forEach(person => {
                    balances[person] = (balances[person] || 0) - share;
                });
            });
        
            return balances;
        }

        function calculateTotalExpenseByUser(expenses: IExpense[]): Record<string, number> {
            const totalExpenseByUser: Record<string, number> = {};
        
            expenses.forEach(({ user, cost }) => {
                totalExpenseByUser[user] = (totalExpenseByUser[user] || 0) + cost;
            });
        
            return totalExpenseByUser;
        }

        type Transaction = { from: string; to: string; amount: number };

        function minimizeTransactions(balances: Record<string, number>): Transaction[] {
          const debts: Transaction[] = [];
      
          const creditors = Object.entries(balances).filter(([, balance]) => balance > 0);
          const debtors = Object.entries(balances).filter(([, balance]) => balance < 0);
      
          let i = 0, j = 0;
      
          while (i < creditors.length && j < debtors.length) {
              const [creditor, credit] = creditors[i];
              const [debtor, debt] = debtors[j];
              const amount = Math.min(credit, -debt);
      
              debts.push({ from: debtor, to: creditor, amount });
      
              creditors[i][1] -= amount;
              debtors[j][1] += amount;
      
              if (creditors[i][1] === 0) i++;
              if (debtors[j][1] === 0) j++;
          }
      
          return debts;
      }

        const balances = calculateBalances(expenses.map(expense => expense.toObject()))
        const totalExpenseByUser = calculateTotalExpenseByUser(expenses.map(expense => expense.toObject()))
        const transactions = minimizeTransactions(balances)

    const calculateNetChange = (
      expenses: typeof allExpenses,
      person: string
    ): number => {
      let cashInflow = 0;
      let cashOutflow = 0;

      expenses.forEach((expense) => {
        if (expense.user === person) {
          const average = expense.cost / expense.involvedUsers.length;
          cashOutflow += expense.cost - average;
        } else if (expense.involvedUsers.includes(person)) {
          cashInflow += expense.cost / expense.involvedUsers.length;
        }
      });

      return Number((cashInflow - cashOutflow).toFixed(2));
    };

    const calculateNetChangeForAll = (
      expenses: typeof allExpenses
    ): Record<string, number> => {
      const persons: string[] = Array.from(
        new Set(
          expenses.reduce<string[]>((acc, expense) => {
            acc.push(expense.user, ...expense.involvedUsers);
            return acc;
          }, [])
        )
      );
      const netChanges: Record<string, number> = {};

      persons.forEach((person) => {
        const netChange = calculateNetChange(expenses, person);
        netChanges[person] = netChange;
      });

      return netChanges;
    };

    const netChanges: Record<string, number> =
      calculateNetChangeForAll(expenses);

    // Categorize into Givers and Receivers
    const givers: string[] = Object.keys(netChanges).filter(
      (person) => netChanges[person] > 0
    );
    const receivers: string[] = Object.keys(netChanges).filter(
      (person) => netChanges[person] < 0
    );

    interface PaymentInstruction {
      from: string;
      to: string;
      amount: number;
    }

    const settlePaymentsOptimized = (
      givers: string[],
      receivers: string[]
    ): PaymentInstruction[] => {
      let payments: PaymentInstruction[] = [];

      givers.sort((a, b) => netChanges[b] - netChanges[a]);
      receivers.sort((a, b) => netChanges[a] - netChanges[b]);

      let i = 0;
      let j = 0;
      while (i < givers.length && j < receivers.length) {
        const giver = givers[i];
        const receiver = receivers[j];

        const giverAmount = netChanges[giver];
        const receiverAmount = Math.abs(netChanges[receiver]);

        if (giverAmount > receiverAmount) {
          payments.push({
            from: giver,
            to: receiver,
            amount: receiverAmount,
          });
          netChanges[giver] -= receiverAmount;
          j++;
        } else if (giverAmount < receiverAmount) {
          payments.push({
            from: giver,
            to: receiver,
            amount: giverAmount,
          });
          netChanges[receiver] += giverAmount;
          i++;
        } else {
          payments.push({
            from: giver,
            to: receiver,
            amount: giverAmount,
          });
          i++;
          j++;
        }
      }

      return payments;
    };

    const paymentInstructionsOptimized: PaymentInstruction[] =
      settlePaymentsOptimized(givers, receivers);

    // Prepare and send the response

    const response = {
      netChanges,
      givers,
      receivers,
      paymentInstructionsOptimized,
      balances,
      totalExpenseByUser,
      transactions,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
