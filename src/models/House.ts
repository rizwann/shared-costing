// src/models/house.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IHouse extends Document {
  code: string;
  description: string;
  image: string;
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
});

const House = mongoose.model<IHouse>("House", HouseSchema);
export default House;
