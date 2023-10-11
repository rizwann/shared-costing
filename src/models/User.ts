import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  authentication: {
    password: string;
    salt: string;
    sessionToken: string;
  };
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
  authentication: {
    password: {
      type: String,
      required: true,
    },
    salt: { type: String, select: false },
    sessionToken: { type: String, select: false },
  },
  houseCodes: {
    type: [String], // Array of house codes
    default: [],
  },
});

const User = mongoose.model<IUser>("User", UserSchema);

export const createUser = (values: Record<string, any>) =>
  new User(values).save().then((user) => user.toObject());

export default User;
