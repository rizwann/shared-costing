import mongoose, { Document, Schema } from "mongoose";
export interface IPlayerStat extends Document {
    player_id: number;
    name: string;
    profile_photo: string;
    player_skill: string;
    is_verified: number;
    is_captain: number;
    is_admin: number;
    is_player_pro: number;
    association_tag: string;
    is_primary_login: number;
    batter_category: string;
    batter_category_info: string;
    bowler_category: string;
    bowler_category_info: string;
    profileLink: string;
    stats: {
        Matches: string;
        Innings: string;
        'Not out': string;
        Runs: string;
        'Highest Runs': string;
        Avg: string;
        SR: string;
        '30s': string;
        '50s': string;
        '100s': string;
        '4s': string;
        '6s': string;
        Ducks: string;
        Won: string;
        Loss: string;
    };
    }
const PlayerStatSchema: Schema = new Schema({
    player_id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    profile_photo: {
        type: String,
        // required: true,
    },
    player_skill: {
        type: String,
        // required: true,
    },
    is_verified: {
        type: Number,
        required: true,
    },
    is_captain: {
        type: Number,
        required: true,
    },
    is_admin: {
        type: Number,
        required: true,
    },
    is_player_pro: {
        type: Number,
        // required: true,
    },
    association_tag: {
        type: String,
        // required: true,
    },
    is_primary_login: {
        type: Number,
        // required: true,
    },
    batter_category: {
        type: String,
        // required: true,
    },
    batter_category_info: {
        type: String,
        // required: true,
    },
    bowler_category: {
        type: String,
        // required: true,
    },
    bowler_category_info: {
        type: String,
        // required: true,
    },
    profileLink: {
        type: String,
        required: true,
    },
    stats: {
        Matches: {
            type: String,
            // required: true,
        },
        Innings: {
            type: String,
            // required: true,
        },
        'Not out': {
            type: String,
            // required: true,
        },
        Runs: {
            type: String,
            // required: true,
        },
        'Highest Runs': {
            type: String,
            // required: true,
        },
        Avg: {
            type: String,
            // required: true,
        },
        SR: {
            type: String,
            // required: true,
        },
        '30s': {
            type: String,
            // required: true,
        },
        '50s': {
            type: String,
            // required: true,
        },
        '100s': {
            type: String,
            // required: true,
        },
        '4s': {
            type: String,
            // required: true,
        },
        '6s': {
            type: String,
            // required: true,
        },
        Ducks: {
            type: String,
            // required: true,
        },
        Won: {
            type: String,
            // required: true,
        },
        Loss: {
            type: String,
            // required: true,
        },
    },
});

const PlayerStat = mongoose.model<IPlayerStat>("PlayerStat", PlayerStatSchema);
export default PlayerStat;