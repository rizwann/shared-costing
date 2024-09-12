// authMiddleware.ts

import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Expense from "../models/Expense";
import House from "../models/House";
import { User } from "../models/User";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log(token);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized, no token found" });
  }

  try {
    const decoded: any = jwt.verify(token, "your-secret-key");
    req.body.userId = decoded.userId;
    console.log("decoded", decoded.userId);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized!" });
  }
};
export const checkExpenseDeleteEditRights = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { expenseId } = req.params;
    const userId = req.body.userId;
    //get the expense by id and if it does not exist return 404, dont go to catch block
    const expense = await Expense.findById(expenseId); // Find the expense by ID

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Check if the user requesting the action is also a member of the house the expense belongs to
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userHouses = user.houseCodes;

    if (!userHouses.includes(expense.houseCode)) {
      return res
        .status(403)
        .json({ message: "Unauthorized, you are not a member of this house" });
    }

    // Check if the user requesting the action is also the creator of the expense
    if (expense.entryBy !== userId && expense.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized, you are not the creator or payer of this expense" });
    }

    next();
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ message: `Invalid value for ${error.path} was provided` });
    }
    res.status(500).json({ message: "Server error" });
  }
}
export const checkExpenseOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { expenseId } = req.params;
    const userId = req.body.userId;
    //get the expense by id and if it does not exist return 404, dont go to catch block
    const expense = await Expense.findById(expenseId); // Find the expense by ID

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Check if the user requesting the action is also a member of the house the expense belongs to
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userHouses = user.houseCodes;

    if (!userHouses.includes(expense.houseCode)) {
      return res
        .status(403)
        .json({ message: "Unauthorized, you are not a member of this house" });
    }
   

    next();
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ message: `Invalid value for ${error.path} was provided` });
    }
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
    const currentUserId = req.body.userId;

    if (userId !== currentUserId.toString())
      return res
        .status(403)
        .json({ message: "Unauthorized, you only can access your expenses!" });

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
    console.log(houseCode);
    const userId = req.body.userId;

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

// export const isAuthenticated = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const sessionToken = req.cookies["USER_AUTH"];

//     if (!sessionToken) {
//       return res.status(403).json({ message: "No session token" });
//     }

//     const existingUser = await User.findOne({
//       "authentication.sessionToken": sessionToken,
//     });

//     if (!existingUser) {
//       return res.status(403).json({ message: "Invalid session token" });
//     }

//     merge(req, { identity: existingUser });

//     return next();
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

export const isOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.body.userId;
    if (!currentUserId) {
      return res
        .status(403)
        .json({ message: "Unauthorized, you are not allowed" });
    }
      
    const user = await User.findById(currentUserId)
    
    const reqUser = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "You are not  authenticated" });
    }
    if (
      user && user.username.toLocaleLowerCase() === "RizwanKabir".toLocaleLowerCase()
    ) {
      return next();
    }

    if (userId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const isHouseMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const currentUserId = req.body.userId;
    const user = await User.findById(currentUserId);

    const house = await House.findById(id);

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    const admin =
      user?.username.toLocaleLowerCase() === "Rizwan".toLocaleLowerCase() ||
      user?.username.toLocaleLowerCase() === "RizwanKabir".toLocaleLowerCase();

    if(admin){
      return next();
    }
    const houseMembers = house.users;

    if (!houseMembers.includes(currentUserId)) {
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
export const isHouser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.params;
    const currentUserId = req.body.userId;

    const house = await House.findOne({ code });

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    const houseMembers = house.users;

    if (!houseMembers.includes(currentUserId)) {
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
export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUserId = req.body.userId;

    const user = await User.findById(currentUserId);

    const admin =
      user?.username.toLocaleLowerCase() === "Rizwan".toLocaleLowerCase() ||
      user?.username.toLocaleLowerCase() === "RizwanKabir".toLocaleLowerCase();

    if (!admin) {
      return res
        .status(403)
        .json({ message: "Unauthorized, you are not a super user" });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
