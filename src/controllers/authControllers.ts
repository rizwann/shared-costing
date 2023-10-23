// authController.ts
import bcrypt from "bcrypt";

import { Request, Response } from "express";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

// export const registerUser = async (req: Request, res: Response) => {
//   try {
//     // Validate user input
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { username, email, password } = req.body;

//     // Check if the user already exists
//     let user = await User.findOne({ email });
//     if (user) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     // Hash the password
//     const saltRounds = 10;
//     const hashedPassword = await bcrypt.hash(password, saltRounds);

//     // Create a new user
//     user = new User({
//       username,
//       email,
//       authentication: { password: hashedPassword },
//     });
//     await user.save();

//     res.status(201).json({ message: "User registered successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// export const loginUser = async (req: Request, res: Response) => {
//   try {
//     const { email, password } = req.body;

//     // Check if the user exists
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Compare passwords
//     const passwordMatch = await bcrypt.compare(
//       password,
//       user?.authentication?.password
//     );
//     if (!passwordMatch) {
//       return res.status(403).json({ message: "Invalid credentials" });
//     }
//     const loggedInUser = {
//       _id: user._id,
//       username: user.username,
//       email: user.email,
//     };

//     res.status(200).json({ message: "Login successful", user: loggedInUser });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const regUser = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  try {
    // Validate user input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if the user already exists, username and email must be unique
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: "Username already exists" });
      } else {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    console.log(user);

    await user.save();

    return res
      .status(201)
      .json({ message: "User registered successfully", user: user })
      .end();
  } catch (error) {
    return res.status(500).json({ message: "Server error bc" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  try {
    if (!(email || username) || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email/username and password" });
    }

    const user = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, "your-secret-key", {
      expiresIn: "1y",
    });

    res.cookie("USER_TOKEN", token);

    return res.status(200).json({ token, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// export const authCheck = async (req: Request, res: Response) => {
//   const { email } = req.body;
//   const sessionToken = req.cookies["USER_AUTH"];

//   if (!sessionToken) {
//     return res
//       .status(400)
//       .json({ isAuthenticated: false, message: "No session token" });
//   }
//   // find the user with this session token and email
//   const user = await User.findOne({
//     "authentication.sessionToken": sessionToken,
//     email: email,
//   });

//   if (!user) {
//     return res.status(400).json({
//       isAuthenticated: false,
//       message: "Invalid session token, Login again",
//     });
//   }
//   user.authentication.sessionToken = sessionToken;

//   return res.status(200).json({
//     isAuthenticated: true,
//     message: "User authenticated",
//     user,
//   });
// };
