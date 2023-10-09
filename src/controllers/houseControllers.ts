import { Request, Response } from "express";
import House from "../models/House";
import User from "../models/User";

export const createHouse = async (req: Request, res: Response) => {
  try {
    const { code, description } = req.body;
    const image = req.file ? req.file.path : undefined;
    const userId = req.session?.user?._id; // Get the user ID from the session

    // Check for duplicate code or description
    const existingHouseWithCode = await House.findOne({ code });
    const existingHouseWithDescription = await House.findOne({ description });

    if (existingHouseWithCode) {
      return res.status(400).json({ message: "Duplicate code" });
    }

    if (existingHouseWithDescription) {
      return res.status(400).json({ message: "Duplicate description" });
    }

    const house = new House({ code, description, image, users: [userId] }); // Add user ID to the users array
    await house.save();
    // add house code to user's houseCodes array
    const user = await User.findById(userId);
    if (user) {
      user.houseCodes.push(code);
      await user.save();
    }

    res.status(201).json({ message: "House created successfully", house });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getHousesByUserId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const houses = await House.find({ users: id });

    if (!houses) {
      return res.status(404).json({ message: "Houses not found" });
    }

    res.status(200).json(houses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateHouse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const image = req.file ? req.file.path : undefined;

    const house = await House.findById(id);

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    // Check for duplicate description

    const existingHouseWithDescription = await House.findOne({
      description,
      _id: { $ne: id },
    });

    if (existingHouseWithDescription) {
      return res.status(400).json({ message: "Duplicate name" });
    }

    house.description = description;
    if (image) {
      house.image = image;
    }

    await house.save();

    res.status(200).json({ message: "House updated successfully", house });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteHouse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const house = await House.findById(id);

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    await House.deleteOne({ _id: id });
    res.status(200).json({ message: `House ${house.description} deleted` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const joinHouse = async (req: Request, res: Response) => {
  try {
    const { houseCode } = req.body;

    // Find the house with the provided code
    const house = await House.findOne({ code: houseCode });

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    // Add the user to the house

    const user = await User.findById(req.session?.user?._id);

    if (user) {
      // Check if the user is not already in the house
      if (!user.houseCodes.includes(houseCode)) {
        user.houseCodes.push(houseCode); // Add the house code to user's houseCodes array
        await user.save();
        house.users.push(user._id); // Add the user to the house's users array
        await house.save();
        res.status(200).json({ message: "Joined house successfully" });
      } else {
        res.status(400).json({ message: "User is already in the house" });
      }
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
