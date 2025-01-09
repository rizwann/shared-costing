import mongoose, { Document, Schema } from "mongoose";

export interface IStore extends Document {
  name: string;
  image?: string;
}

const StoreSchema: Schema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
});

const Store = mongoose.model<IStore>("Store", StoreSchema);
export default Store;
