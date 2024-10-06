import { Request, Response } from "express"
import Expense, { CategoryName } from "../models/Expense"
import { User } from "../models/User"
import Store from "../models/Store"

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

export const getLast6MonthsExpensesByHouse = async (
  req: Request,
  res: Response
) => {
  try {
    const { houseCode, month, year } = req.params // Check for optional month and year params
    const { userId } = req.body
    const today = new Date()

    // Determine the current month and year based on params or default to current
    const currentMonth = month ? parseInt(month) - 1 : today.getMonth() // months are 0-indexed
    const currentYear = year ? parseInt(year) : today.getFullYear()

    // Set the start date to six months ago
    const sixMonthsAgo = new Date(currentYear, currentMonth, 1)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5) // move six months back

    // Fetch expenses within the last 6 months for the given house and user
    const allExpenses = await Expense.find({ userId, houseCode })
      .select("cost date")
      .sort({ date: 1 })
      .gte("date", sixMonthsAgo)
      .lte("date", new Date(currentYear, currentMonth + 1, 0)) // Include all expenses till the end of current month
      .exec()

    if (!allExpenses.length) {
      return res.status(404).json({ message: "No expenses found" })
    }

    // Map and reduce expenses by month
    const expenses = allExpenses
      .map((entry: any) => ({
        month: entry.date.getMonth(),
        totalExpense: entry.cost,
      }))
      .reduce((acc: any, curr: any) => {
        if (acc[curr.month]) {
          acc[curr.month] += curr.totalExpense
        } else {
          acc[curr.month] = curr.totalExpense
        }
        return acc
      }, {})

    // Define month names
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
    ]

    // Create a result array with the months and their respective expenses
    const result = Object.entries(expenses).map((entry: any) => ({
      month: Number(entry[0]),
      totalExpense: entry[1],
    }))

    const finalResult = monthsOfTheYear.map((month, idX) => {
      const entry = result.find((exp) => exp.month === idX)
      return {
        name: month,
        expenses: entry ? entry.totalExpense.toFixed(2) : 0,
      }
    })

    // Extract the last 6 months' expenses based on the current month
    const last6Months = finalResult.slice(
      sixMonthsAgo.getMonth(),
      currentMonth + 1
    )

    // Calculate the total expenses for the current month and the average of the last 5 months
    const currentMonthExpenses = last6Months[last6Months.length - 1].expenses
    const last5Months = last6Months.slice(0, last6Months.length - 1)

    // Filter out months with no expenses for accurate averaging
    const monthsWithExpenses = last5Months.filter(
      (month) => Number(month.expenses) > 0
    )
    const totalExpenses = monthsWithExpenses.reduce(
      (total, month) => total + Number(month.expenses),
      0
    )
    const last5MonthsExpensesAvg = monthsWithExpenses.length
      ? totalExpenses / monthsWithExpenses.length
      : 0

    // Calculate the percentage difference between the current month and last 5 months average
    let percentage = Math.round(
      ((currentMonthExpenses - last5MonthsExpensesAvg) /
        last5MonthsExpensesAvg) *
        100
    )
    if (isNaN(percentage)) {
      percentage = 0
    }

    res.status(200).json({
      percentage,
      last6Months,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
}

export const getLast6MonthsExpensesOfHouse = async (
  req: Request,
  res: Response
) => {
  try {
    const { houseCode, month, year } = req.params
    const { userId } = req.body

    const today = new Date()
    console.log("month year", month, year)

    // Determine the current month and year based on params or current date
    const currentMonth = month ? parseInt(month) - 1 : today.getMonth() // months are 0-indexed in JavaScript
    const currentYear = year ? parseInt(year) : today.getFullYear()

    // Calculate the date six months ago from the provided/current month and year
    const sixMonthsAgo = new Date(currentYear, currentMonth, 1)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5) // Set to six months ago

    // const allExpenses = await Expense.find({ houseCode })
    //   .select("cost date")
    //   .sort({ date: 1 })
    //   .gte("date", sixMonthsAgo)
    //   .lte("date", new Date(currentYear, currentMonth + 1, 0)) // end of the current month
    //   .exec();
    // Ensure the end date includes the full day of the last day of the month
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0)
    endOfMonth.setHours(23, 59, 59, 999) // Set to the last millisecond of the day

    const allExpenses = await Expense.find({ houseCode })
      .select("cost date")
      .sort({ date: 1 })
      .gte("date", sixMonthsAgo)
      .lte("date", endOfMonth) // Use endOfMonth to include the full last day
      .exec()

    if (!allExpenses.length) {
      return res.status(404).json({ message: "No expenses found" })
    }

    // Group expenses by month and aggregate totals
    const expenses = allExpenses
      .map((entry: any) => ({
        month: entry.date.getMonth(),
        totalExpense: entry.cost,
      }))
      .reduce((acc: any, curr: any) => {
        if (acc[curr.month]) {
          acc[curr.month] += curr.totalExpense
        } else {
          acc[curr.month] = curr.totalExpense
        }
        return acc
      }, {})

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
    ]

    const result = Object.entries(expenses).map((entry: any) => ({
      month: Number(entry[0]),
      totalExpense: entry[1],
    }))

    console.log("expenses", expenses)
    console.log(
      "last element from allExpenses",
      allExpenses[allExpenses.length - 1]
    )

    const finalResult = monthsOfTheYear.map((month, idX) => {
      const entry = result.find((exp) => exp.month === idX)
      return {
        name: month,
        expenses: entry ? entry.totalExpense.toFixed(2) : 0,
      }
    })

    const last6Months = finalResult.slice(
      sixMonthsAgo.getMonth(),
      currentMonth + 1
    )

    // Find the percentage... compare the last 5 months average with the current month
    const currentMonthExpenses = Number(
      last6Months[last6Months.length - 1].expenses
    )
    const last5Months = last6Months.slice(0, last6Months.length - 1)

    // Filter out months with no expenses for accurate averaging
    const monthsWithExpenses = last5Months.filter(
      (month) => Number(month.expenses) > 0
    )
    const totalExpenses = monthsWithExpenses.reduce(
      (total, month) => total + Number(month.expenses),
      0
    )
    const last5MonthsExpensesAvg = monthsWithExpenses.length
      ? totalExpenses / monthsWithExpenses.length
      : 0

    let percentage = Math.round(
      ((currentMonthExpenses - last5MonthsExpensesAvg) /
        last5MonthsExpensesAvg) *
        100
    )
    if (isNaN(percentage)) {
      percentage = 0
    }

    res.status(200).json({
      totalExpensesThisMonth: currentMonthExpenses.toFixed(2),
      percentage,
      last6Months,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
}

export const getCurrentMonthExpensesByHouseMembers = async (
  req: Request,
  res: Response
) => {
  try {
    const { houseCode, month, year } = req.params
    const today = new Date()

    // Use provided month and year, or fallback to the current month/year
    const currentMonth = month ? parseInt(month) - 1 : today.getMonth() // months are 0-indexed
    const currentYear = year ? parseInt(year) : today.getFullYear()

    // Define the start and end dates for the current month
    const startOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1))
    const endOfMonth = new Date(
      Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)
    )

    // Aggregate expenses for the given houseCode and within the month range
    const expenses = await Expense.aggregate([
      {
        $match: {
          houseCode,
          date: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: "$userId",
          expenses: { $sum: "$cost" },
        },
      },
    ])

    // Fetch users belonging to the houseCode
    const users = await User.find({ houseCodes: houseCode })

    // Map users to their expenses
    const result = users.map((user) => {
      const entry = expenses.find(
        (exp) => exp._id.toString() === user._id.toString()
      )
      return {
        name: user.username,
        expenses: entry ? Number(entry.expenses).toFixed(2) : 0,
        firstName: user.name ? user.name.split(" ")[0] : user.name,
      }
    })

    res.status(200).json(result)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
}

export const getCurrentMonthExpenseComparison = async (
  req: Request,
  res: Response
) => {
  const { houseCode, month, year } = req.params
  const { userId } = req.body
  try {
    const expenses = await Expense.find({ houseCode, userId: userId })

    if (expenses.length === 0) {
      return res
        .status(404)
        .json({ message: "No expenses found for this user" })
    }

    const date = new Date()

    // Check if `month` and `year` are provided in params, otherwise default to the current date
    const currentMonth = month ? parseInt(month) - 1 : date.getMonth()
    const currentYear = year ? parseInt(year) : date.getFullYear()

    // Calculate previous month and year accordingly
    let prevMonth = currentMonth - 1
    let prevYear = currentYear
    if (prevMonth < 0) {
      prevYear -= 1
      prevMonth = 11 // December of the previous year
    }

    // Filter expenses for the current month and year
    const expensesOfthisMonth = expenses.filter(
      (expense) =>
        expense.date.getMonth() === currentMonth &&
        expense.date.getFullYear() === currentYear
    )

    const totalExpensesThisMonth = Number(
      expensesOfthisMonth
        .reduce((total, expense) => total + expense.cost, 0)
        .toFixed(2)
    )

    // Filter expenses for the previous month and year
    const expensesOfLastMonth = expenses.filter(
      (expense) =>
        expense.date.getMonth() === prevMonth &&
        expense.date.getFullYear() === prevYear
    )

    const totalExpensesLastMonth = Number(
      expensesOfLastMonth
        .reduce((total, expense) => total + expense.cost, 0)
        .toFixed(2)
    )

    // Calculate percentage difference, handle cases where the last month's expenses are 0
    let percentage = 0
    if (totalExpensesLastMonth > 0) {
      percentage = Math.round(
        ((totalExpensesThisMonth - totalExpensesLastMonth) /
          totalExpensesLastMonth) *
          100
      )
    }

    res.status(200).json({
      totalExpensesThisMonth,
      totalExpensesLastMonth,
      percentage,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
}

export const getCurrentMonthExpensesByCategory = async (
  req: Request,
  res: Response
) => {
  try {
    const { houseCode, month, year } = req.params // Check for optional month and year params
    const { userId } = req.body
    const today = new Date()

    // Determine the current month and year based on params or default to current
    const currentMonth = month ? parseInt(month) - 1 : today.getMonth() // months are 0-indexed in JavaScript
    const currentYear = year ? parseInt(year) : today.getFullYear()

    // Get the first day of the selected/current month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1)

    const currentMonthExpenses = await Expense.find({ houseCode, userId }) // Filter by houseCode and userId
      .select("category cost")
      .sort({ category: 1 })
      .gte("date", firstDayOfMonth) // Filter from the first day of the selected month
      .lte("date", new Date(currentYear, currentMonth + 1, 0)) // End of the selected month
      .exec()

    if (currentMonthExpenses.length === 0) {
      return res
        .status(404)
        .json({
          message: "No expenses found for this user in the selected month",
        })
    }

    // Group expenses by category
    const expensesByCategory = currentMonthExpenses.reduce(
      (acc: any, curr: any) => {
        if (acc[curr.category]) {
          acc[curr.category] += curr.cost
        } else {
          acc[curr.category] = curr.cost
        }
        return acc
      },
      {}
    )

    const result = Object.entries(expensesByCategory).map((entry: any) => ({
      name: entry[0],
      expenses: Number(entry[1].toFixed(2)),
    }))

    // Find the highest expense category
    let highestExpense = { name: "", expenses: 0 }

    for (let i = 0; i < result.length; i++) {
      if (Number(result[i].expenses) > Number(highestExpense.expenses)) {
        highestExpense = result[i]
      }
    }

    // Calculate total expenses for the month
    const totalExpenses = result.reduce(
      (total: number, expense: any) => total + expense.expenses,
      0
    )

    // Calculate the percentage of the highest expense category
    const percentage = Math.round(
      (highestExpense.expenses / totalExpenses) * 100
    )

    res.status(200).json({ result, highestExpense, percentage })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
}

export const getCurrentMonthExpensesByStore = async (
  req: Request,
  res: Response
) => {
  try {
    const { houseCode } = req.params
    const { userId } = req.body
    const today = new Date()
    const currentMonth = today.getMonth()

    const expenses = await Expense.find({ houseCode })
      .select("storeName cost")
      .sort({ storeName: 1 })
      .gte("date", new Date(today.getFullYear(), currentMonth, 1))
      .exec()

    if (expenses.length === 0) {
      return res
        .status(404)
        .json({ message: "No expenses found for this user" })
    }

    //group by store
    const expensesByStore = expenses.reduce((acc: any, curr: any) => {
      if (acc[curr.storeName]) {
        acc[curr.storeName] += curr.cost
      } else {
        acc[curr.storeName] = curr.cost
      }
      return acc
    }, {})

    const result = Object.entries(expensesByStore).map((entry: any) => ({
      name: entry[0],
      expenses: Number(entry[1].toFixed(2)),
    }))

    //find the highest expense store

    let highestExpense = { name: "", expenses: 0 }

    for (let i = 0; i < result.length; i++) {
      if (Number(result[i].expenses) > Number(highestExpense.expenses)) {
        highestExpense = result[i]
      }
    }
    // percentage of the highest expense store from the total expenses
    const totalExpenses = result.reduce(
      (total: number, expense: any) => total + expense.expenses,
      0
    )

    const percentage = Math.round(
      (highestExpense.expenses / totalExpenses) * 100
    )

    // get the image of the highest expense store
    const image = await Store.findOne({ name: highestExpense.name }).select(
      "image"
    )

    res
      .status(200)
      .json({ result, highestExpense, percentage, image: image?.image })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
}

export const getLast6MonthsExpensesByCategory = async (
  req: Request,
  res: Response
) => {
  try {
    const { houseCode } = req.params
    const { userId } = req.body
    const today = new Date()
    const sixMonthsAgo = new Date(today)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)

    const allExpenses = await Expense.find({ houseCode })
      .select("cost date category")
      .sort({ date: 1 })
      .gte("date", sixMonthsAgo)
      .lte("date", today)
      .exec()

    if (!allExpenses.length) {
      return res.status(404).json({ message: "No expenses found" })
    }

    const expenses = allExpenses
      .map((entry: any) => ({
        month: entry.date.getMonth(),
        category: entry.category,
        totalExpense: entry.cost,
      }))
      .reduce((acc: any, curr: any) => {
        if (acc[curr.month]) {
          if (acc[curr.month][curr.category]) {
            acc[curr.month][curr.category] += curr.totalExpense
          } else {
            acc[curr.month][curr.category] = curr.totalExpense
          }
        } else {
          acc[curr.month] = {}
          acc[curr.month][curr.category] = curr.totalExpense
        }
        return acc
      }, {})
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
    ]

    const result = Object.entries(expenses).map((entry: any) => ({
      month: Number(entry[0]),
      expenses: entry[1],
    }))

    const finalResult = monthsOfTheYear.map((month, idX) => {
      const entry = result.find((exp) => exp.month === idX)
      return {
        name: month,
        expenses: entry ? entry.expenses : {},
      }
    })

    const last6Months = finalResult.slice(
      sixMonthsAgo.getMonth(),
      today.getMonth() + 1
    )

    const response = last6Months.map((month) => {
      const monthName = month.name
      const expenses = month.expenses
      const categories = Object.values(CategoryName)
      const expensesObj: any = {}
      categories.forEach((category) => {
        expensesObj[category] = 0
      })
      return {
        name: monthName,
        ...expensesObj,
        ...expenses,
      }
    })
    res.status(200).json(response)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
}
