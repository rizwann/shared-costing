// authController.ts
import bcrypt from "bcrypt";

import { Request, Response } from "express";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
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
      return res.json({ status: "User does not exist!!" });
    }
    const secret = "your-secret-key" + oldUser.password;
    const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
      expiresIn: "5m",
    });
    const link = `http://localhost:3000/api/reset-password/${oldUser._id}/${token}`;
    // var transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: "adarsh438tcsckandivali@gmail.com",
    //     pass: "rmdklolcsmswvyfw",
    //   },
    // });

    // var mailOptions = {
    //   from: "youremail@gmail.com",
    //   to: oldUser.email,
    //   subject: "Password Reset Link from Expense Tracker",
    //   text: link,
    // };

    // transporter.sendMail(mailOptions, function (error, info) {
    //   if (error) {
    //     console.log(error);
    //   } else {
    //     console.log("Email sent: " + info.response);
    //   }
    // });
    console.log(link);
    res.json({ status: "Password Reset Link Sent to your email id", link });
  } catch (error) {
    console.log(error);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { id, token } = req.params;
  console.log(req.params);
  const oldUser = await User.findById(id);
  if (!oldUser) {
    return res.json({ status: "User Not Exists!!" });
  }
  const secret = "your-secret-key" + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    if (!verify) {
      return res.json({ status: "Token not matched" });
    }
    res.json({ verify, status: "Verified" });
  } catch (error) {
    console.log(error);
    res.send("Not Verified");
  }
};

export const resetPWPost = async (req: Request, res: Response) => {
  const { id, token } = req.params;
  const { password } = req.body;

  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: "User Not Exists!!" });
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
  } catch (error) {
    console.log(error);
    res.json({ status: "Something Went Wrong" });
  }
};
