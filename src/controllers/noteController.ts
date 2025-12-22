import { Request, Response } from "express"
import { Note } from "../models/Note"

// GET /api/notes - Get all notes
export const getNotes = async (req: Request, res: Response) => {
  try {
    const notes = await Note.find()
    res.status(200).json(notes)
  } catch (error) {
    res.status(500).json({ message: "Error fetching notes", error })
  }
}

// GET /api/notes/house/:houseCode - Get all notes for a specific house
export const getNotesByHouseCode = async (req: Request, res: Response) => {
  const { houseCode } = req.params

  try {
    let notes = await Note.find({ houseCode })
    if (notes.length === 0) {
      return res.status(404).json({ message: "No notes found for this house" })
    }
    notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    // sort the todos inside each note by status (pending, done, rejected)
    notes.forEach(note => {
      note.todos.sort((a, b) => {
        const statusOrder = { pending: 1, done: 2, rejected: 3 }
        return statusOrder[a.status] - statusOrder[b.status]
      })
    })
    res.status(200).json(notes)

  } catch (error) {
    res.status(500).json({ message: "Error fetching notes", error })
  }
}

// POST /api/notes - Create a new note
export const createNote = async (req: Request, res: Response) => {
  try {
    const { title, description, todos, userId, houseCode } = req.body
    console.log("lewra", req.body)
    if (!title || !userId || !houseCode) {
      return res.status(400).json({ message: "Title, userId, and houseCode are required" })
    }
    const newNote = new Note({
      title,
      description,
      todos: todos || [],
      userId,
      houseCode,
    })
    console.log("henda", todos)
    const savedNote = await newNote.save()    
    
    res.status(201).json(savedNote)
  } catch (error) {
    res.status(500).json({ message: "Error creating note", error })
  }
}

// PUT /api/notes/:noteId - Update a note (title, description, todos)
export const updateNote = async (req: Request, res: Response) => {
  const { noteId } = req.params
  const { title, description, todos } = req.body

  try {
    const updatedNote = await Note.findByIdAndUpdate(
      noteId,
      {
        title,
        description,
        todos,
      },
      { new: true }
    )

    if (!updatedNote) {
      return res.status(404).json({ message: "Note not found" })
    }

    res.status(200).json(updatedNote)
  } catch (error) {
    res.status(500).json({ message: "Error updating note", error })
  }
}

// DELETE /api/notes/:noteId - Delete a note
export const deleteNote = async (req: Request, res: Response) => {
  const { noteId } = req.params

  try {
    const deletedNote = await Note.findByIdAndDelete(noteId)

    if (!deletedNote) {
      return res.status(404).json({ message: "Note not found" })
    }

    res.status(200).json({ message: "Note deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting note", error })
  }
}

// PATCH /api/notes/:noteId/todos/:todoId - Update status of a single todo
export const updateTodoStatus = async (req: Request, res: Response) => {
  const { noteId, todoId } = req.params
  const { status } = req.body

  try {
    const note = await Note.findById(noteId)
    if (!note) return res.status(404).json({ message: "Note not found" })

    const todo = note.todos.id(todoId)
    if (!todo) return res.status(404).json({ message: "Todo not found" })

    todo.status = status
    await note.save()

    res.status(200).json(note)
  } catch (error) {
    res.status(500).json({ message: "Error updating todo status", error })
  }
}
