// src/models/house.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IHouse extends Document {
  code: string;
  description: string;
  image: string;
  users: string[]; // Array of user ids
  userNames: string[]; // Array of user names
  timeZone: string;
  currency: string;
}

const HouseSchema: Schema = new Schema({
  code: {
    type: String,
    unique: true,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  users: {
    type: [Schema.Types.ObjectId], // Array of user ids
    default: [],
  },
  userNames: {
    //array of user names
    type: [String],
    default: [],
  },
  timeZone: {
    type: String,
    default: "Europe/Berlin",
  },
  currency: {
    type: String,
    default: "EUR",
  },
});

const House = mongoose.model<IHouse>("House", HouseSchema);
export default House;

// add house to the user and login with house
// add house to the expense
