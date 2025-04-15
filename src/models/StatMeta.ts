// models/StatMeta.ts
import mongoose from "mongoose"

const StatMetaSchema = new mongoose.Schema({
  lastUpdated: { type: Date, default: Date.now },
})

export default mongoose.model("StatMeta", StatMetaSchema)
