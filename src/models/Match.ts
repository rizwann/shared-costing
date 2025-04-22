import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema({
  tournament: String,
  venueAndDate: String,
  matchType: String,
  status: String,
  teams: [String],
  result: String,
  link: String,
  score: mongoose.Schema.Types.Mixed, // to store team scores (object)
}, { timestamps: true });

export const Match = mongoose.models.Match || mongoose.model('Match', MatchSchema);
