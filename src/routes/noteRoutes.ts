import express from "express"
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  updateTodoStatus,
  getNotesByHouseCode,
} from "../controllers/noteController"
import { authMiddleware, checkNoteOwnership } from "../middlewares/authMiddleware"

const router = express.Router()

router.use(authMiddleware)

// Get all notes
// router.get("/", getNotes)

//Get all notes of the house
router.get("/house/:houseCode", authMiddleware, checkNoteOwnership, getNotesByHouseCode)

// Create a new note
router.post("/", authMiddleware, createNote)

// Update a note (title, description, todos)
router.put("/:noteId", updateNote)

// Delete a note
router.delete("/:noteId", deleteNote)

// Update status of a single todo inside a note
router.patch("/:noteId/todos/:todoId", updateTodoStatus)

export default router
