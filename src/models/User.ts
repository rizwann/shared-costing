import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  houseCodes: string[]; // Array of house codes the user belongs to
}

const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  houseCodes: {
    type: [String], // Array of house codes
    default: [],
  },
});

const User = mongoose.model<IUser>("User", UserSchema);
export default User;
