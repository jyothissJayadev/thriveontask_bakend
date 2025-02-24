import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ["days", "weeks", "months"],
    required: true,
  },
  parent_task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task", // Reference to the Task schema
    required: true,
  },
  children: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task", // Array of references to the Task schema
    },
  ],
  color: {
    type: String,
    required: true, // Color to identify the category
  },
});

export default mongoose.model("Category", categorySchema);
