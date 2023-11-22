import mongoose, { Document, Schema } from "mongoose";

export interface IExpense extends Document {
  storeName?: string;
  storeImg?: string;
  storeId: string;
  cost: number;
  category: string;
  description: string;
  user: string; // User id who added the expense
  houseCode: string; // House id to which the expense is assigned
  //involved Users
  involvedUsers: string[];
  date: Date;
}
export enum CategoryName {
  Other = "Other",
  Grocery = "Grocery",
  Restaurant = "Restaurant",
  Clothing = "Clothing",
  Entertainment = "Entertainment",
  Butcher = "Butcher",
}

const ExpenseSchema: Schema = new Schema({
  storeName: {
    type: String,
  },
  storeImg: {
    type: String,
  },
  storeId: {
    type: Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: Object.values(CategoryName),
    required: true,
  },

  description: {
    type: String,
    required: true,
  },
  user: {
    type: String,
    required: true,
  },
  houseCode: {
    type: String, //
    required: true,
  },
  involvedUsers: [
    {
      type: String,
      required: true,
    },
  ],
  date: {
    type: Date,
    required: true,
  },
});

const Expense = mongoose.model<IExpense>("Expense", ExpenseSchema);
export default Expense;
