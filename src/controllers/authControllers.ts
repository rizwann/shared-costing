// authController.ts
import bcrypt from "bcrypt";

import { Request, Response } from "express";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { User } from "../models/User";

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
      $or: [{ email: email }, { username: username }],
    }).collation({ locale: "en", strength: 2 }); // 'en' is for English language, strength 2 for case-insensitive

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

    return res.status(200).json({
      token,
      user: {
        email: user.email,
        username: user.username,
        houseCodes: user.houseCodes,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const forgetPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const oldUser = await User.findOne({ email });
    if (!oldUser) {
      return res.status(404).json({ message: "User email does not exist!!" });
    }
    const secret = "your-secret-key" + oldUser.password;
    const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
      expiresIn: "5m",
    });
    const APP_URL = process.env.APP_URL as string;
    const FE_URL = process.env.FRONTEND_URL as string;

    const link = `${APP_URL}/reset-password/${oldUser._id}/${token}`;
    // const emailLink = `${FE_URL}/reset-password/${oldUser._id}/${token}`;
    const emailLink = `${FE_URL}/reset-password/${oldUser._id}?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.APP_EMAIL as string,
        pass: process.env.APP_PASSWORD as string,
      },
    });

    var mailOptions = {
      from: {
        name: "House Expense Manager",
        address: process.env.APP_EMAIL as string,
      },
      to: oldUser.email,
      subject: "Password Reset Link from Expense Tracker",
      html: `

      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f3f3f3;
            }
          </style>
        </head>
        <body>
          <div class="container" style="background-color: #ffffff; border-radius: 5px; padding: 20px; margin: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <img src="${process.env.LOGO_URL}" alt="House Ex Manager" class="logo" style="width: 100px; height: 100px;" />
            <h2 style="color: #333;">Password Reset Request</h2>
            <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Hello there,</p>
            <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">You've requested to reset your account password. Click the button below to proceed:</p>
            <a href="${emailLink}" class="button" style="display: inline-block; color: #ffffff; padding: 12px 20px; text-align: center; text-decoration: none; border-radius: 4px; margin-top: 20px; background-color: #7C3AED;">Reset Password</a>
            <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">If you didn't make this request, you can safely ignore this email.</p>
            <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Best regards,</p>
            <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Your House Expensen Manager Team</p>
          </div>
        </body>
      </html>

     `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    res.json({ status: "Password Reset Link Sent to your email id", link });
  } catch (error) {
    console.log(error);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { id, token } = req.params;
  const oldUser = await User.findById(id);
  if (!oldUser) {
    return res.status(404).json({ message: "User does not exist!!" });
  }
  const secret = "your-secret-key" + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    if (!verify) {
      return res.status(401).json({ message: "Token not matched" });
    }
    res.json({ verify, status: "Verified" });
  } catch (error: any) {
    console.log(error.message);
    res.status(500).json({
      message: error.message
        ? "Password Reset Link Expired or Invalid"
        : "Something Went Wrong!",
    });
  }
};

export const resetPWPost = async (req: Request, res: Response) => {
  const { id, token } = req.params;
  const { password } = req.body;

  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.status(404).json({ message: "User does not exist!!" });
  }
  const secret = "your-secret-key" + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    if (!verify) {
      return res.json({ status: "Token not matched" });
    }
    const encryptedPassword = await bcrypt.hash(password, 10);
    await User.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          password: encryptedPassword,
        },
      }
    );

    res.json({ status: "password updated successfully" });

    // redirect to login page
  } catch (error) {
    console.log(error);
    res.json({ status: "Something Went Wrong" });
  }
};
