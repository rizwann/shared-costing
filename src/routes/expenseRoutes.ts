import express from "express";

import {
  calculateHouseExpensesAndDebts,
  createExpense,
  deleteExpense,
  getAllExpensesByUser,
  getAllExpensesByUserInHouse,
  getExpenseById,
  getExpensesOfCurrentMonthByUserInHouse,
  getExpensesOfCurrentWeekByUserInHouse,
  getExpensesOfCurrentYearByUserInHouse,
  getExpensesOfHouse,
  getExpensesOfSpecificHouseByYear,
  getExpensesOfSpecificMonthAndYearByHouse,
  getExpensesOfSpecificMonthAndYearByUserInHouse,
  getExpensesOfSpecificYearByUserInHouse,
  updateExpense,
} from "../controllers/expenseControllers";
import {
  authMiddleware,
  checkExpenseDeleteEditRights,
  checkExpenseOwnership,
  checkExpensesOwnershipAndHouseOwnership,
  checkHouseOwnership,
} from "../middlewares/authMiddleware";
import { v2 as cloudinary } from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";


const router = express.Router();

// Configure Cloudinary Storage with Transformations
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Correct Cloudinary Storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "receipts",
      format: "jpg", // Automatically convert to jpg
      public_id: Date.now() + "-" + req.body.description,
      transformation: [
        { width: 800, height: 600, crop: "limit" }, // Resize with a limit
        { quality: "auto" }, // Automatic quality adjustment
        { fetch_format: "auto" }, // Automatic format selection (e.g., WebP)
      ],
    }
  },
})

const upload = multer({ storage })

router.use(authMiddleware);

// Create a new expense
router.post("/create", upload.single("receipt"), authMiddleware, createExpense);

// Get all expenses
//router.get("/", getAllExpenses);

// Get a single expense by ID
router.get("/:expenseId", checkExpenseOwnership, getExpenseById);

// Get all expenses by user ID
router.get("/user/:userId", getAllExpensesByUser);

// Update an expense by ID
router.post("/:expenseId", upload.single("receipt"), authMiddleware,checkExpenseDeleteEditRights, updateExpense);

// Delete an expense by ID
router.delete("/:expenseId", checkExpenseDeleteEditRights, deleteExpense);

// all routes for expenses reporting

// Get all expensens by user Id and house code
router.get(
  "/user/:userId/:houseCode/all",
  checkExpensesOwnershipAndHouseOwnership,
  getAllExpensesByUserInHouse
);

//get expense of current month by the user in a specific house

router.get(
  "/user/:userId/:houseCode/currentMonth",
  checkExpensesOwnershipAndHouseOwnership,
  getExpensesOfCurrentMonthByUserInHouse
);

//get expense of current week by the user in a specific house

router.get(
  "/user/:userId/:houseCode/currentWeek",
  checkExpensesOwnershipAndHouseOwnership,
  getExpensesOfCurrentWeekByUserInHouse
);

// get expense of current year by the user in a specific house

router.get(
  "/user/:userId/:houseCode/currentYear",
  checkExpensesOwnershipAndHouseOwnership,
  getExpensesOfCurrentYearByUserInHouse
);

// // get expense of a specific year by the user in a specific house
router.get(
  "/user/:userId/:houseCode/:year",
  checkExpensesOwnershipAndHouseOwnership,
  getExpensesOfSpecificYearByUserInHouse
);

// get expenses of a specific month and year by the user in a specific house

router.get(
  "/user/:userId/:houseCode/:year/:month",
  checkExpensesOwnershipAndHouseOwnership,
  getExpensesOfSpecificMonthAndYearByUserInHouse
);

// get all expenses of current month/all/lastMonth in a specific house

router.get("/house/:houseCode", checkHouseOwnership, getExpensesOfHouse);

// get expense of a specific year in a specific house

router.get(
  "/house/:houseCode/:year",
  checkHouseOwnership,
  getExpensesOfSpecificHouseByYear
);

// get expenses of a specific month and year  in a specific house

router.get(
  "/house/:houseCode/:year/:month",
  checkHouseOwnership,
  getExpensesOfSpecificMonthAndYearByHouse
);
router.get(
  "/balance/:houseCode",
  checkHouseOwnership,
  calculateHouseExpensesAndDebts
);

router.get(
  "/balance/:houseCode/:month/:year",
  checkHouseOwnership,
  calculateHouseExpensesAndDebts
);

export default router;
