import { Request, Response } from "express";
import House from "../models/House";

export const createHouse = async (req: Request, res: Response) => {
  try {
    const { code, description } = req.body;
    const image = req.file ? req.file.path : undefined;

    // Check for duplicate code or description
    const existingHouseWithCode = await House.findOne({ code });
    const existingHouseWithDescription = await House.findOne({ description });

    if (existingHouseWithCode || existingHouseWithDescription) {
      return res.status(400).json({ message: "Duplicate code or name" });
    }

    const house = new House({ code, description, image });
    await house.save();

    res.status(201).json({ message: "House created successfully", house });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getHouses = async (req: Request, res: Response) => {
  try {
    const houses = await House.find();
    res.status(200).json(houses);
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
