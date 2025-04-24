import { Request, Response } from "express"
import Expense, { CategoryName } from "../models/Expense"
import { User } from "../models/User"
import { monthsOfTheYear } from "../utils"

// Get house expenses by store

export const getHouseExpensesByStores = async (req: Request, res: Response) => {
  try {
    const { houseCode } = req.params

    const { currentMonth, lastMonth } = req.query

    const matchStage: any = {
      houseCode,
    }

    if (currentMonth === "true") {
      const today = new Date()
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()

      matchStage.date = {
        $gte: new Date(currentYear, currentMonth, 1), // Start of the current month
        $lte: new Date(currentYear, currentMonth + 1, 0), // End of the current month
      }
    } else if (lastMonth === "true") {
      const today = new Date()
      let prevMonth = today.getMonth() - 1
      let prevYear = today.getFullYear()

      if (prevMonth < 0) {
        prevYear -= 1
        prevMonth = 11 // December
      }

      matchStage.date = {
        $gte: new Date(prevYear, prevMonth, 1), // Start of the last month
        $lte: new Date(prevYear, prevMonth + 1, 0), // End of the last month
      }
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
    ])

    if (expenses.length === 0) {
      const month = currentMonth === "true" ? "this" : "last"
      return res.status(404).json({ message: `No expenses for ${month} month` })
    }

    const result = expenses.map((entry: any) => ({
      name: entry.name.toUpperCase(),
      expenses: entry.expenses,
    }))

    res.status(200).json(result)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
}

export const getUserWeeklyTotal = async (req: Request, res: Response) => {
  try {
    const { houseCode } = req.params
    const { userId } = req.body
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const weeklyExpenses = await Expense.find({ userId: userId, houseCode })
      .select("cost date")
      .sort({ date: 1 })
      .gte("date", sevenDaysAgo)
      .lte("date", today)
      .exec()

    if (!weeklyExpenses.length) {
      return res.status(404).json({ message: "No expenses found" })
    }

    const expenses = weeklyExpenses
      .map((entry: any) => ({
        day: entry.date.getDay(),
        totalExpense: entry.cost,
      }))
      .reduce((acc: any, curr: any) => {
        if (acc[curr.day]) {
          acc[curr.day] += curr.totalExpense
        } else {
          acc[curr.day] = curr.totalExpense
        }
        return acc
      }, {})

    const result = Object.entries(expenses).map((entry: any) => ({
      day: Number(entry[0]),
      totalExpense: entry[1],
    }))
    const finalResult = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
      (day, idX) => {
        const entry = result.find((exp) => exp.day === idX)
        return {
          name: day,
          expenses: entry ? entry.totalExpense.toFixed(2) : 0,
        }
      }
    )

    res.status(200).json(finalResult)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
}

export const getLast6MonthsExpensesByHouse = async (req: Request, res: Response) => {
  try {
    const { houseCode, month, year } = req.params;
    const today = new Date();

    const currentMonth = month ? parseInt(month) - 1 : today.getMonth(); // 0-indexed
    const currentYear = year ? parseInt(year) : today.getFullYear();

    // Start from the 1st of current month and go back 5 months
    const startDate = new Date(currentYear, currentMonth - 5, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59); // end of current month

    // Aggregate directly in MongoDB
    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          houseCode,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            year: { $year: "$date" },
          },
          total: { $sum: "$cost" },
        },
      },
    ]);

    if (!monthlyExpenses.length) {
      return res.status(404).json({ message: "No expenses found" });
    }

    // Normalize to last 6 months with 0 fallback
    const monthsOfTheYear = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const last6Months: { name: string; expenses: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const matched = monthlyExpenses.find(
        (entry) => entry._id.month === month && entry._id.year === year
      );

      last6Months.push({
        name: monthsOfTheYear[month - 1],
        expenses: matched ? matched.total.toFixed(2) : "0",
      });
    }

    const currentMonthExpenses = Number(last6Months[5].expenses);
    const last5 = last6Months.slice(0, 5).map((m) => Number(m.expenses));
    const nonZero = last5.filter((val) => val > 0);
    const avg = nonZero.length ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;
    const percentage = avg === 0 ? 0 : Math.round(((currentMonthExpenses - avg) / avg) * 100);

    res.status(200).json({
      percentage,
      last6Months,
    });
  } catch (error) {
    console.error("Error in getLast6MonthsExpensesByHouse:", error);
    res.status(500).json({ message: "Server error" });
  }
};



export const getLast6MonthsExpensesOfHouse = async (
  req: Request,
  res: Response
) => {
  try {
    const { houseCode, month, year } = req.params;
    const today = new Date();

    const currentMonth = month ? parseInt(month) - 1 : today.getMonth();
    const currentYear = year ? parseInt(year) : today.getFullYear();

    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const sixMonthsAgo = new Date(currentYear, currentMonth, 1);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // Aggregate directly in MongoDB
    const expenses = await Expense.aggregate([
      {
        $match: {
          houseCode,
          date: { $gte: sixMonthsAgo, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          total: { $sum: "$cost" },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: { $subtract: ["$_id.month", 1] }, // JS month index (0-based)
          total: { $round: ["$total", 2] },
        },
      },
    ]);

    if (!expenses.length) {
      return res.status(404).json({ message: "No expenses found" });
    }

    // Map Mongo results to full month name list
    const monthsOfTheYear = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    // Build a map of expenses by month index
    const expensesMap = new Map<number, number>();
    expenses.forEach(({ month, total }) => {
      expensesMap.set(month, total);
    });

    // Build the final list of last 6 months, ensuring correct wrap-around for Jan-Dec
    const last6Months: { name: string; expenses: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const expense = expensesMap.get(monthIndex) || 0;
      last6Months.push({
        name: monthsOfTheYear[monthIndex],
        expenses: expense.toFixed(2),
      });
    }

    // Calculate percentage change
    const currentMonthExpenses = Number(last6Months[5].expenses);
    const last5Months = last6Months.slice(0, 5);
    const validMonths = last5Months.filter((m) => Number(m.expenses) > 0);
    const total = validMonths.reduce((acc, m) => acc + Number(m.expenses), 0);
    const avg = validMonths.length ? total / validMonths.length : 0;

    let percentage = avg ? Math.round(((currentMonthExpenses - avg) / avg) * 100) : 0;
    if (isNaN(percentage)) percentage = 0;

    res.status(200).json({
      totalExpensesThisMonth: currentMonthExpenses.toFixed(2),
      percentage,
      last6Months,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getCurrentMonthExpensesByHouseMembers = async (req: Request, res: Response) => {
  try {
    const { houseCode, month, year } = req.params;
    const today = new Date();

    // Use provided month and year, or fallback to the current month/year
    const currentMonth = month ? parseInt(month) - 1 : today.getMonth(); // months are 0-indexed
    const currentYear = year ? parseInt(year) : today.getFullYear();

    // Define the start and end dates for the current month
    const startOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1));
    const endOfMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));

    // Fetch expenses for the current month for the given houseCode
    const allExpenses = await Expense.find({
      houseCode,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).sort({ date: -1 });

    if (!allExpenses.length) {
      return res.status(404).json({ message: "No expenses found" });
    }

    // Aggregate expenses by user
    const expenses = allExpenses.reduce((acc: any, expense: any) => {
      acc[expense.user] = (acc[expense.user] || 0) + expense.cost;
      return acc;
    }, {});

    // Fetch users belonging to the houseCode
    const users = await User.find({ houseCodes: houseCode });

    // Create a user map for fast look-up
    const userMap = users.reduce((map: any, user: any) => {
      map[user.username] = user;
      return map;
    }, {});

    // Combine expenses and user information
    const result = users.map((user) => {
      const userExpense = expenses[user.username] || 0;
      return {
        name: user.username,
        expenses: userExpense.toFixed(2),
        firstName: user.name ? user.name.split(" ")[0] : user.name,
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
  const { houseCode, month, year } = req.params;
  const { userId } = req.body;
  try {
    const date = new Date();
    const currentMonth = month ? parseInt(month) - 1 : date.getMonth();
    const currentYear = year ? parseInt(year) : date.getFullYear();

    // Calculate the previous month and year accordingly
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth < 0) {
      prevYear -= 1;
      prevMonth = 11; // December of the previous year
    }

    // Define the date range for the current and previous months
    const startOfCurrentMonth = new Date(Date.UTC(currentYear, currentMonth, 1));
    const endOfCurrentMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));

    const startOfLastMonth = new Date(Date.UTC(prevYear, prevMonth, 1));
    const endOfLastMonth = new Date(Date.UTC(prevYear, prevMonth + 1, 0, 23, 59, 59, 999));

    // Fetch expenses for the current and previous months in a single query
    const expenses = await Expense.find({
      houseCode,
      userId,
      $or: [
        { date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth } },
        { date: { $gte: startOfLastMonth, $lte: endOfLastMonth } }
      ]
    });

    if (!expenses.length) {
      return res.status(404).json({ message: "No expenses found for this user" });
    }

    // Calculate total expenses for this month and last month
    let totalExpensesThisMonth = 0;
    let totalExpensesLastMonth = 0;

    expenses.forEach((expense) => {
      const isThisMonth = expense.date.getMonth() === currentMonth && expense.date.getFullYear() === currentYear;
      const isLastMonth = expense.date.getMonth() === prevMonth && expense.date.getFullYear() === prevYear;

      if (isThisMonth) totalExpensesThisMonth += expense.cost;
      if (isLastMonth) totalExpensesLastMonth += expense.cost;
    });

    // Calculate percentage difference
    let percentage = 0;
    if (totalExpensesLastMonth > 0) {
      percentage = Math.round(
        ((totalExpensesThisMonth - totalExpensesLastMonth) / totalExpensesLastMonth) * 100
      );
    }

    res.status(200).json({
      totalExpensesThisMonth: Number(totalExpensesThisMonth.toFixed(2)),
      totalExpensesLastMonth: Number(totalExpensesLastMonth.toFixed(2)),
      percentage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



export const getCurrentMonthExpensesByCategory = async (
  req: Request,
  res: Response
) => {
  try {
    const { houseCode, month, year } = req.params;
    const today = new Date();

    const currentMonth = month ? parseInt(month) - 1 : today.getMonth();
    const currentYear = year ? parseInt(year) : today.getFullYear();

    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 1); // exclusive

    const result = await Expense.aggregate([
      {
        $match: {
          houseCode,
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$cost" },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          expenses: { $round: ["$total", 2] },
        },
      },
    ]);

    if (!result.length) {
      return res.status(404).json({
        message: "No expenses found for this user in the selected month",
      });
    }

    // Determine highest expense and total in one loop
    let highestExpense = { name: "", expenses: 0 };
    let totalExpenses = 0;

    for (const item of result) {
      totalExpenses += item.expenses;
      if (item.expenses > highestExpense.expenses) {
        highestExpense = item;
      }
    }

    const percentage = Math.round(
      (highestExpense.expenses / totalExpenses) * 100
    );

    res.status(200).json({
      result,
      highestExpense,
      percentage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



export const getCurrentMonthExpensesByStore = async (
  req: Request,
  res: Response
) => {
  try {
    const { houseCode, month, year } = req.params;
    const today = new Date();
    const currentMonth = month ? parseInt(month) - 1 : today.getMonth(); // 0-indexed
    const currentYear = year ? parseInt(year) : today.getFullYear();

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const storeExpenses = await Expense.aggregate([
      {
        $match: {
          houseCode,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: "$storeName",
          total: { $sum: "$cost" },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          expenses: { $round: ["$total", 2] },
        },
      },
      {
        $sort: { expenses: -1 },
      },
    ]);

    if (!storeExpenses.length) {
      return res
        .status(404)
        .json({ message: "No expenses found for this user" });
    }

    // Top five stores
    const topFive = storeExpenses.slice(0, 5);

    // Highest expense store
    const highestExpense = topFive[0];

    // Total expenses
    const totalExpenses = storeExpenses.reduce(
      (acc, store) => acc + store.expenses,
      0
    );

    const percentage = totalExpenses
      ? Math.round((highestExpense.expenses / totalExpenses) * 100)
      : 0;

    res.status(200).json({
      result: topFive,
      highestExpense,
      percentage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getLast6MonthsExpensesByCategory = async (
  req: Request,
  res: Response,
) => {
  try {
    const { houseCode, month, year } = req.params
    const today = new Date()
    const currentMonth = month ? parseInt(month) - 1 : today.getMonth()
    const currentYear = year ? parseInt(year) : today.getFullYear()

    const start = new Date(currentYear, currentMonth, 1)
    start.setMonth(start.getMonth() - 5) // go 5 months back for a 6-month window

    const allExpenses = await Expense.find({
      houseCode,
      date: { $gte: start, $lte: today },
    }).select("cost category date").exec()

    if (!allExpenses.length) {
      return res.status(404).json({ message: "No expenses found" })
    }

    // Organize monthly expenses by category
    const monthlyExpenses: Record<number, Partial<Record<CategoryName, number>>> = {}

    allExpenses.forEach((entry: any) => {
      const monthIndex = entry.date.getMonth()
      const category = entry.category as CategoryName

      if (!monthlyExpenses[monthIndex]) {
        monthlyExpenses[monthIndex] = {}
      }

      if (!monthlyExpenses[monthIndex]![category]) {
        monthlyExpenses[monthIndex]![category] = 0
      }

      monthlyExpenses[monthIndex]![category]! += entry.cost
    })

    // Map to result structure
    const finalResult = monthsOfTheYear.map((monthName, index) => {
      return {
        name: monthName,
        expenses: monthlyExpenses[index] || {},
      }
    })

    const monthIndexes: number[] = []
    for (let i = 0; i < 6; i++) {
      const monthIndex = (start.getMonth() + i) % 12
      monthIndexes.push(monthIndex)
    }
    const last6Months = monthIndexes.map((monthIndex) => {
      const monthData = finalResult[monthIndex]
      const filledExpenses: Record<CategoryName, number> = Object.fromEntries(
        Object.values(CategoryName).map((c) => [c, 0])
      ) as Record<CategoryName, number>

      const combinedExpenses = {
        ...filledExpenses,
        ...(monthData.expenses as Record<CategoryName, number>)
      }

      return {
        name: monthData.name,
        expenses: combinedExpenses
      }
    })


    const catComparison = Object.values(CategoryName).map((category) => {
      const catExpenses = last6Months.map((month) => {
        return {
          month: month.name,
          expenses: month.expenses[category] ?? 0
        }
      })
      return {
        name: category,
        expenses: catExpenses
      }
    })


    res.status(200).json({ response: last6Months, finalResult, last6Months, catComparison })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
}

export const getLast6MonthsExpensesByHouseStoreName = async (req: Request, res: Response) => {
  try {
    const { houseCode, month, year } = req.params
    const today = new Date()

    const currentMonth = month ? parseInt(month) - 1 : today.getMonth() // months are 0-indexed
    const currentYear = year ? parseInt(year) : today.getFullYear()

    // Set the start date to six months ago
    const sixMonthsAgo = new Date(currentYear, currentMonth, 1)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5) // move six months back

    // Fetch expenses within the last 6 months for the given house and user
    const allExpenses = await Expense.find({ houseCode })

    if (!allExpenses.length) {
      return res.status(404).json({ message: "No expenses found" })
    }

    const allExpensesLast6Months = allExpenses.filter(
      (expense: any) =>
        expense.date >= sixMonthsAgo && expense.date <= today
    )

    const initialExpenses = allExpensesLast6Months
      .map((entry: any) => ({
        month: entry.date.getMonth(),
        storeName: entry.storeName,
        totalExpense: entry.cost,
      }))

    const allStoreNames = [...new Set(initialExpenses.map((entry: any) => entry.storeName))]

    const modiFiedExpensesWithCommonStoreNames = initialExpenses.map((entry: any) => {
      const commonStoreName = allStoreNames.find((storeName => storeName.includes(entry.storeName) || entry.storeName.includes(storeName) ||
        storeName.toLowerCase().includes(entry.storeName.toLowerCase()) || entry.storeName.toLowerCase().includes(storeName.toLowerCase())))
      const modieFiedStoreName = commonStoreName ? commonStoreName : entry.storeName
      return {
        month: entry.month,
        storeName: modieFiedStoreName,
        totalExpense: entry.totalExpense
      }
    }
    )
    const storeNamesUnsorted = [...new Set(modiFiedExpensesWithCommonStoreNames.map((entry: any) => entry.storeName))]
    const storeNames = storeNamesUnsorted?.sort()
    const bal = modiFiedExpensesWithCommonStoreNames.reduce((acc: any, curr: any) => {
      if (acc[curr.month]) {
        if (acc[curr.month][curr.storeName]) {
          acc[curr.month][curr.storeName] += curr.totalExpense
        } else {
          acc[curr.month][curr.storeName] = curr.totalExpense
        }
      } else {
        acc[curr.month] = {}
        acc[curr.month][curr.storeName] = curr.totalExpense
      }
      return acc
    }
      , {})
    const result = Object.entries(bal).map((entry: any) => ({
      month: Number(entry[0]),
      expenses: entry[1],
    })
    )

    const finalResult = monthsOfTheYear.map((month, idX) => {
      const entry = result.find((exp) => exp.month === idX)
      return {
        name: month,
        expenses: entry ? entry.expenses : {},
      }
    })

    const last6MonthsIndices: number[] = []
    for (let i = 0; i < 6; i++) {
      const monthIndex = (sixMonthsAgo.getMonth() + i) % 12;
      last6MonthsIndices.push(monthIndex);
    }

    const last6Months = last6MonthsIndices.map((monthIndex) => {
      return finalResult[monthIndex]
    })



    const responseAll = last6Months.map((month) => {
      const monthName = month.name
      const expenses = month.expenses
      const storeNames = Object.keys(expenses)
      const storeObj: any = {}
      storeNames.forEach((storeName) => {
        storeObj[storeName] = expenses[storeName]
      })
      return {
        name: monthName,
        ...storeObj,
      }
    }
    )
    const response = responseAll.map((month) => {
      const monthName = month.name
      const expenses = month
      const storeNames = Object.keys(expenses)
      const top10Stores = storeNames.sort((a, b) => expenses[b] - expenses[a])
      const storeObj: any = {}
      top10Stores.forEach((storeName) => {
        storeObj[storeName] = expenses[storeName]
      })
      return {
        name: monthName,
        ...storeObj,
      }
    }
    )

    const storeComparison = storeNames.map((storeName) => {
      const storeExpenses = response.map((month) => {
        return {
          month: month.name,
          expenses: month[storeName] ? month[storeName] : 0
        }
      }
      )
      return {
        name: storeName.trimEnd(),
        expenses: storeExpenses
      }
    }
    )
    res.status(200).json({ storeNames, storeComparison })


  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }

}