// authController.ts
import bcrypt from "bcrypt";

import { Request, Response } from "express";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import House from "../models/House";
import { sendAppEmail } from "../utils/email"

export const regUser = async (req: Request, res: Response) => {
  const { username, email, password, name } = req.body;
  const image = req.file ? req.file.path : undefined;

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
      name,
      image,
    });


    await user.save();

    // Send email
    const APP_URL = process.env.APP_URL as string;
    const FE_URL = process.env.FRONTEND_URL as string;

    const secret = "your-secret-key" + email;
    const token = jwt.sign({ email }, secret, {
      expiresIn: "1y",
    });
    const link = `${APP_URL}/api/auth/activate/${user._id}/${token}`;
    const emailLink = `${FE_URL}/auth/activate/${user._id}?token=${token}`;

    var mailOptions = {
      from: {
        name: "House Expense Manager",
        address: process.env.APP_EMAIL as string,
      },
      to: email,
      subject: "Welcome Aboard! House Expense Tracker Awaits You",
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
          <div class="container" style="background-color: #ffffff; border-radius: 5px; padding: 20px; margin: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1;">
            <img src="${process.env.LOGO_URL}" alt="House Ex Manager" class="logo" style="width: 100px; height: 100px;" />
            <h2 style="color: #333;">Welcome to House Expense Manager</h2>
            <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Hello ${username},</p>
            <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">We're thrilled to have you as a member of House Expense Manager. With our platform, managing your house expenses has never been easier!</p>
            <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Explore all the features we offer and start taking control of your expenses today:</p>
            <ul class="text" style="color: #333; font-size: 16px; margin-top: 20px; padding-left: 20px;">
              <li>Track your daily expenses effortlessly</li>
              <li>Get monthly notification for shared costs</li>
              <li>Analyze your spending with insightful reports</li>
              <li>And much more!</li>
            </ul>
            <a href="${emailLink}" class="button" style="display: inline-block; color: #ffffff; padding: 12px 20px; text-align: center; text-decoration: none; border-radius: 4px; margin-top: 20px; background-color: #7C3AED;">Activate your account</a>
            <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">If you have any questions or need assistance, our support team is here to help. Feel free to reach out to us at pranto@outlook.de.</p>
            <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Once again, welcome to House Expense Manager. We're excited to have you on board!</p>
            <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Best regards,</p>
            <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Your House Expense Manager Team</p>
          </div>
        </body>
      </html>
      

     `,
    };

    await sendAppEmail(mailOptions)

    return res
      .status(201)
      .json({
        message: "User registered successfully",
        user: {
          email: user.email,
          username: user.username,
          houseCodes: user.houseCodes,
        },
        activationLink: link,
      })
      .end();
  } catch (error) {
    return res.status(500).json({ message: "Server error bc" });
  }
};

export const activateUser = async (req: Request, res: Response) => {
  const { id, token } = req.params;
  try {
    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ message: "Invalid activation token provided" });
    }
    if (user.active) {
      return res.status(200).json({ message: "Account already activated" });
    }
    const secret = "your-secret-key" + user.email;
    const verify = jwt.verify(token, secret);
    if (!verify) {
      return res.status(401).json({ message: "Token not matched" });
    }
    // Update the user's 'active' property to true
    user.active = true;
    await user.save();

    // Send email

    const username = user.username.toLocaleUpperCase();

    const mailOptions = {
      from: {
        name: "House Expense Manager",
        address: process.env.APP_EMAIL as string,
      },
      to: user.email,
      subject: "Account Activated: Welcome to House Expense Manager!",
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
         <h2 style="color: #333;">Account Activation</h2>
         <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Hello ${username},</p>
         <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Your House Expense Manager account has been successfully activated!</p>
         <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">You can now log in and start managing your expenses with ease.</p>
         <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">If you have any questions or need assistance, our support team is here to help. Feel free to reach out to us at support@houseexpensemgr.com.</p>
         <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Thank you for choosing House Expense Manager. We look forward to assisting you in managing your expenses.</p>
         <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Best regards,</p>
         <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Your House Expense Manager Team</p>
       </div>
     </body>
   </html>
   
   

  `,
    };

    await sendAppEmail(mailOptions)

    return res.status(200).json({ message: "Account activated successfully" });
  } catch (error: any) {
    res.status(500).json({
      message: error.message
        ? "Activation Link is Expired or Invalid"
        : "Something Went Wrong!",
    });
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
      return res.status(401).json({
        message: "The password that you've entered is incorrect ",
      });
    }

    const token = jwt.sign({ userId: user._id }, "your-secret-key", {
      expiresIn: "1y",
    });

    res.cookie("USER_TOKEN", token, {
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
      domain: process.env.FRONTEND_URL,
    });
// add house names to user object
const houses = await House.find({ code: { $in: user.houseCodes } });
    
  
// return res.status(200).json({ ...user.toObject(), houses });
    return res.status(200).json({
      token,
      user: {
       ...user.toObject(),
        houses
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
            <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">If you didn’t make this request, you can ignore this email and carry on as usual.</p>
            <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Best regards,</p>
            <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Your House Expense Manager Team</p>
          </div>
        </body>
      </html>

     `,
    };

    await sendAppEmail(mailOptions)

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
