// authController.ts
import bcrypt from "bcrypt";

import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { random } from "../helpers";
import User, { createUser } from "../models/User";
export const registerUser = async (req: Request, res: Response) => {
  try {
    // Validate user input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if the user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new user
    user = new User({
      username,
      email,
      authentication: { password: hashedPassword },
    });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(
      password,
      user?.authentication?.password
    );
    if (!passwordMatch) {
      return res.status(403).json({ message: "Invalid credentials" });
    }
    const loggedInUser = {
      _id: user._id,
      username: user.username,
      email: user.email,
    };

    res.status(200).json({ message: "Login successful", user: loggedInUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const regUser = async (req: Request, res: Response) => {
  try {
    // Validate user input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if the user already exists, username and email must be unique

    let existingUserWithEmail = await User.findOne({ email });
    if (existingUserWithEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }
    let existingUserWithUsername = await User.findOne({ username });
    if (existingUserWithUsername) {
      return res.status(400).json({ message: "Username already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({
      username,
      email,
      authentication: {
        password: hashedPassword,
      },
    });
    return res
      .status(201)
      .json({ message: "User registered successfully", user: user })
      .end();
  } catch (error) {
    return res.status(500).json({ message: "Server error bc" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid Email Provided" });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.authentication.password
    );
    if (!passwordMatch) {
      return res.status(403).json({ message: "Invalid Credentials" });
    }

    const sessionToken = random();
    user.authentication.sessionToken = sessionToken;

    await user.save();

    res.cookie("USER_AUTH", user.authentication.sessionToken, {
      domain: "localhost",
      path: "/",
    });

    res.status(200).json({ message: "Login successful", user: user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const sessionToken = req.cookies["USER_AUTH"];

    if (!sessionToken) {
      return res.status(400).json({ message: "No session token" });
    }

    const user = await User.findOne({
      "authentication.sessionToken": sessionToken,
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid session token" });
    }

    user.authentication.sessionToken = "";

    await user.save();

    res.clearCookie("USER_AUTH");

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Server error" });
  }
};
