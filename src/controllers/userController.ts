import bcrypt from "bcrypt";

import { Request, Response } from "express";
import House from "../models/House";
import { User } from "../models/User";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    const usersWithHouseNames = await Promise.all(
      users.map(async (user) => {
        const houses = await House.find({ code: { $in: user.houseCodes } });
        const houseNames = houses.map((house) => house.description);
        return { ...user.toObject(), houseNames };
      })
    );
    return res.status(200).json({ usersWithHouseNames });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        houseCodes: user.houseCodes,
        active: user.active,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateUsernameEmail = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { username, email } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check for duplicate description

    if (username) {
      const existingUserWithUsername = await User.findOne({
        username,
        _id: { $ne: userId },
      });

      if (existingUserWithUsername) {
        return res
          .status(400)
          .json({ message: "This username is already taken" });
      }

      user.username = username;
    }

    if (email) {
      const existingUserWithEmail = await User.findOne({
        email,
        _id: { $ne: userId },
      });

      if (existingUserWithEmail) {
        return res
          .status(400)
          .json({ message: "This Email is already in use" });
      }

      user.email = email;
    }

    await user.save();
    return res.status(200).json({
      message: "user updated successfully",
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUserPassword = async (req: Request, res: Response) => {
  try {
    const { password, oldPassword, userId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (password && oldPassword) {
      const passwordMatch = await bcrypt.compare(oldPassword, user.password);
      if (!passwordMatch) {
        return res.status(403).json({ message: "Old password did not match" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();
    return res.status(200).json({ message: "password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
