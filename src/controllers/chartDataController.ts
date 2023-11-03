import { Request, Response } from "express";
import Expense from "../models/Expense";
import { User } from "../models/User";

// Get house expenses by store

export const getHouseExpensesByStores = async (req: Request, res: Response) => {
  try {
    const { houseCode } = req.params;

    const { currentMonth, lastMonth } = req.query;

    const matchStage: any = {
      houseCode,
    };

    if (currentMonth === "true") {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      matchStage.date = {
        $gte: new Date(currentYear, currentMonth, 1), // Start of the current month
        $lte: new Date(currentYear, currentMonth + 1, 0), // End of the current month
      };
    } else if (lastMonth === "true") {
      const today = new Date();
      let prevMonth = today.getMonth() - 1;
      let prevYear = today.getFullYear();

      if (prevMonth < 0) {
        prevYear -= 1;
        prevMonth = 11; // December
      }

      matchStage.date = {
        $gte: new Date(prevYear, prevMonth, 1), // Start of the last month
        $lte: new Date(prevYear, prevMonth + 1, 0), // End of the last month
      };
    }

    const expenses = await Expense.aggregate([
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: "$storeId",
          expenses: { $sum: "$cost" },
          name: { $first: "$storeName" },
        },
      },
    ]);

    if (expenses.length === 0) {
      const month = currentMonth === "true" ? "this" : "last";
      return res
        .status(404)
        .json({ message: `No expenses for ${month} month` });
    }

    const result = expenses.map((entry: any) => ({
      name: entry.name.toUpperCase(),
      expenses: entry.expenses,
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserWeeklyTotal = async (req: Request, res: Response) => {
  try {
    const { houseCode } = req.params;
    const { userId } = req.body;
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyExpenses = await Expense.find({ user: userId, houseCode })
      .select("cost date")
      .sort({ date: 1 })
      .gte("date", sevenDaysAgo)
      .lte("date", today)
      .exec();

    if (!weeklyExpenses.length) {
      return res.status(404).json({ message: "No expenses found" });
    }

    const expenses = weeklyExpenses
      .map((entry: any) => ({
        day: entry.date.getDay(),
        totalExpense: entry.cost,
      }))
      .reduce((acc: any, curr: any) => {
        if (acc[curr.day]) {
          acc[curr.day] += curr.totalExpense;
        } else {
          acc[curr.day] = curr.totalExpense;
        }
        return acc;
      }, {});

    const result = Object.entries(expenses).map((entry: any) => ({
      day: Number(entry[0]),
      totalExpense: entry[1],
    }));
    const finalResult = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
      (day, idX) => {
        const entry = result.find((exp) => exp.day === idX);
        return {
          name: day,
          expenses: entry ? entry.totalExpense.toFixed(2) : 0,
        };
      }
    );

    res.status(200).json(finalResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getLast6MonthsExpensesByHouse = async (
  req: Request,
  res: Response
) => {
  try {
    const { houseCode } = req.params;
    const { userId } = req.body;
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    console.log(sixMonthsAgo);

    const allExpenses = await Expense.find({ user: userId, houseCode })
      .select("cost date")
      .sort({ date: 1 })
      .gte("date", sixMonthsAgo)
      .lte("date", today)
      .exec();

    if (!allExpenses.length) {
      return res.status(404).json({ message: "No expenses found" });
    }

    const expenses = allExpenses
      .map((entry: any) => ({
        month: entry.date.getMonth(),
        totalExpense: entry.cost,
      }))
      .reduce((acc: any, curr: any) => {
        if (acc[curr.month]) {
          acc[curr.month] += curr.totalExpense;
        } else {
          acc[curr.month] = curr.totalExpense;
        }
        return acc;
      }, {});
    const monthsOfTheYear = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const result = Object.entries(expenses).map((entry: any) => ({
      month: Number(entry[0]),
      totalExpense: entry[1],
    }));

    const finalResult = monthsOfTheYear.map((month, idX) => {
      const entry = result.find((exp) => exp.month === idX);
      return {
        name: month,
        expenses: entry ? entry.totalExpense.toFixed(2) : 0,
      };
    });

    res.status(200).json(finalResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCurrentMonthExpensesByHouseMembers = async (
  req: Request,
  res: Response
) => {
  try {
    const { houseCode } = req.params;
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const expenses = await Expense.aggregate([
      {
        $match: {
          houseCode,
          date: {
            $gte: new Date(currentYear, currentMonth, 1),
            $lte: new Date(currentYear, currentMonth + 1, 0),
          },
        },
      },
      {
        $group: {
          _id: "$user",
          expenses: { $sum: "$cost" },
        },
      },
    ]);

    const users = await User.find({ houseCodes: houseCode });

    const result = users.map((user) => {
      const entry = expenses.find(
        (exp) => exp._id.toString() === user._id.toString()
      );
      return {
        name: user.username,
        expenses: entry ? entry.expenses.toFixed(2) : 0,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCurrentMonthExpenseComparison = async (
  req: Request,
  res: Response
) => {
  const { houseCode } = req.params;
  const { userId } = req.body;
  try {
    const expenses = await Expense.find({ houseCode, user: userId });

    if (expenses.length === 0) {
      return res
        .status(404)
        .json({ message: "No expenses found for this user" });
    }

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

    const percentage = Math.round(
      ((totalExpensesThisMonth - totalExpensesLastMonth) /
        totalExpensesLastMonth) *
        100
    );

    console.log(percentage);

    res.status(200).json({
      totalExpensesThisMonth,
      totalExpensesLastMonth,
      percentage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
