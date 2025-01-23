// Player: {
//     player_id: 18526831,
//     name: 'Md Azad Hossain',
//     profile_photo: 'https://media.cricheroes.in/user_profile/1711488363261_h7IGtggjL2RJ.jpeg',
//     player_skill: 'BOWL',
//     is_verified: 1,
//     is_captain: 0,
//     is_admin: 0,
//     is_player_pro: 0,
//     association_tag: '',
//     is_primary_login: 1,
//     batter_category: '',
//     batter_category_info: '',
//     bowler_category: 'Aspirant',
//     bowler_category_info: 'This bowler may carry incredible potential and skills but may need more game time.',
//     profileLink: 'https://cricheroes.com/player-profile/18526831/Md-Azad-Hossain/stats',
//      stats: {
//     Matches: '17',
//     Innings: '10',
//     'Not out': '3',
//     Runs: '53',
//     'Highest Runs': '19*',
//     Avg: '7.57',
//     SR: '112.77',
//     '30s': '0',
//     '50s': '0',
//     '100s': '0',
//     '4s': '9',
//     '6s': '0',
//     Ducks: '3',
//     Won: '10',
//     Loss: '7'
//   }
//   }

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