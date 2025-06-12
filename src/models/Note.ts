// Note.ts
import mongoose, { Schema } from 'mongoose';

const TodoSchema = new Schema({
    text: { type: String, required: true },
    status: { type: String, enum: ['pending', 'done', 'rejected'], default: 'pending' },
});

const NoteSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    todos: [TodoSchema],
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    houseCode: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

export const Note = mongoose.model('Note', NoteSchema);
