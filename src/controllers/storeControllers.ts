import { Request, Response } from "express";
import Store from "../models/Store";
import Expense from "../models/Expense";

export const createStore = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const image = req.file ? req.file.path : undefined;

    // Check for duplicate name
    const existingStoreWithName = await Store.findOne({ name });

    if (existingStoreWithName) {
      return res.status(400).json({ message: "Duplicate name" });
    }

    const store = new Store({ name, image });
    await store.save();

    res.status(201).json({ message: "Store created successfully", store });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStores = async (req: Request, res: Response) => {
  try {
    const stores = await Store.find();
    res.status(200).json(stores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStoreById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const store = await Store.findById(id);

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.status(200).json(store);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateStore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const image = req.file ? req.file.path : undefined;

    const store = await Store.findById(id);

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Check for duplicate description

    const existingStoreWithName = await Store.findOne({
      name,
      _id: { $ne: id },
    });

    if (existingStoreWithName) {
      return res.status(400).json({ message: "Duplicate name" });
    }

    store.name = name ? name : store.name;
    if (image) {
      store.image = image;
      //update storeImg in expenses, where storeId equals store.id
      await Expense.updateMany({ storeId: store.id }, { storeImg: image });

    }

    await store.save();

    res.status(200).json({ message: "store updated successfully", store });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteStore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const store = await Store.findById(id);

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    await Store.deleteOne({ _id: id });
    res.status(200).json({ message: `Store ${store.name} deleted` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
