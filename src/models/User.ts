import { Document, Model, Schema, model } from "mongoose";

export interface IUser {
  email: string;
  username: string;
  password: string;
  active?: boolean;
  houseCodes: string[]; // Array of house codes the user belongs to
}

export interface IUserModel extends IUser, Document {}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  active: { type: Boolean, default: false },
  houseCodes: {
    type: [String], // Array of house codes
    default: [],
  },
});

export const User: Model<IUserModel> = model<IUserModel>("User", UserSchema);
