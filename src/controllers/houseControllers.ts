import { Request, Response } from "express";
import House from "../models/House";
import { User } from "../models/User";
import Expense from "../models/Expense";

export const createHouse = async (req: Request, res: Response) => {
  try {
    const { code, description, userId } = req.body;
    const image = req.file ? req.file.path : undefined;

    // Check for duplicate code or description
    const existingHouseWithCode = await House.findOne({ code });
    const existingHouseWithDescription = await House.findOne({ description });

    if (existingHouseWithCode) {
      return res.status(400).json({ message: "Can't accept this code" });
    }

    if (existingHouseWithDescription) {
      return res.status(400).json({ message: `House name →${description}← already exists` });
    }

    const userNames = await User.find({ _id: userId }).select("username")

    const house = new House({
      code,
      description,
      image,
      users: [userId],
      userNames: [userNames[0].username], 
    }); // Add user ID to the users array
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

export const getHouseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const house = await House.findById(id);

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    res.status(200).json(house);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export const getSingleHouse = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const house = await House.findOne({ code });

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    res.status(200).json(house);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getHousesByUserId = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.body.userId;
    const user = await User.findById(currentUserId);

    const admin =
      user?.username.toLocaleLowerCase() === "Rizwan".toLocaleLowerCase() ||
      user?.username === "RizwanKabir".toLocaleLowerCase();

    const houses = admin ? await House.find() : await House.find({ users: currentUserId });

    if (!houses) {
      return res.status(404).json({ message: "Houses not found" });
    }

    res.status(200).json(houses)
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserByHouseCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const house = await House.findOne({ code });

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    const users = await User.find({ houseCodes: house.code });

    if (!users) {
      return res.status(404).json({ message: "Users not found" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateHouse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description, code } = req.body;
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

    const existingHouseWithCode = await House.findOne({
      code,
      _id: { $ne: id },
      
    })
    if (existingHouseWithCode) {
      return res.status(400).json({ message: "Can't use this restricted code" });
    }

    if (existingHouseWithDescription) {
      return res.status(400).json({ message: "Duplicate name" });
    }

    house.description = description;
    if (image) {
      house.image = image;
    }
    if (code !== house.code) {
      const users = await User.find({ houseCodes: house.code });
      users.forEach(async (user) => {
        user.houseCodes = user.houseCodes.filter((code) => code !== house.code);
        user.houseCodes.push(code);
        await user.save();
      });
      const expenses = await Expense.find({ houseCode : house.code })
      expenses.forEach(async (expense) => {
        expense.houseCode = code;
        await expense.save();
      })

      house.code = code;
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

    // Check if the user is the owner of the house (check user id is in the house's users array)

    const house = await House.findById(id);

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    await House.deleteOne({ _id: id });
    // remove house code from all users
    const users = await User.find({ houseCodes: house.code });
    users.forEach(async (user) => {
      user.houseCodes = user.houseCodes.filter((code) => code !== house.code);
      await user.save();
    });
    res.status(200).json({ message: `House ${house.description} deleted` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const joinHouse = async (req: Request, res: Response) => {
  try {
    const { code, userId } = req.body;
    // Find the house with the provided code
    const house = await House.findOne({ code: code });

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    // Add the user to the house

    const user = await User.findById(userId);

    if (user) {
      // Check if the user is not already in the house
      if (!user.houseCodes.includes(code)) {
        user.houseCodes.push(code); // Add the house code to user's houseCodes array
        await user.save();
        if (!house.users.includes(user._id)) {
          house.users.push(user._id); // Add the user to the house's users array
          // add user name to house's userNames array
          house.userNames.push(user.username)
          await house.save();
        }
        res.status(200).json({ message: "Joined house successfully" });
      } else {
        res.status(400).json({ message: "User is already in the house" });
      }
    } else {
      res.status(401).json({
        message: "You are not registered with us... who the fuck are you!!!",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllHouses = async (req: Request, res: Response) => {
  try {
    console.log(req.body);
    const houses = await House.find();

    if (!houses) {
      return res.status(404).json({ message: "No houses found" });
    }

    res.status(200).json(houses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const leaveHouse = async (req: Request, res: Response) => {
  try {
    const { houseCode, userId } = req.body;
    // Find the house with the provided code
    const house = await House.findOne({ code: houseCode });

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    // Remove the user from house

    const user = await User.findById(userId);

    if (user) {
      // Check if the user is not already in the house
      if (user.houseCodes.includes(houseCode)) {
        //remove the house code from user's houseCodes array
        user.houseCodes = user.houseCodes.filter((code) => code !== houseCode);

        await user.save();

        //remove the user from the house's users array, direct assigning not working
        house.users = house.users.filter(
          (id) => id.toString() !== user._id.toString()
        );

        //remove the userName from the house's userNames array
        house.userNames = house.userNames.filter
          ((name) => name !== user.username );

        await house.save();
        res.status(200).json({ message: "Left house successfully" });
      } else {
        res.status(400).json({ message: "User is not in the house" });
      }
    } else {
      res.status(401).json({
        message: "You are not registered with us... who the fuck are you!!!",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
