import Task from "../model/TaskSchema.js";
export const createTask = async (req, res, next) => {
  const { taskName, numberOfUnits, completedUnits, timeframe, duration } =
    req.body;
  const userId = req.user.userId;
  const name = req.user.name;

  try {
    if (
      !taskName ||
      !numberOfUnits ||
      !completedUnits ||
      !timeframe ||
      !duration
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Check if a task with the same name already exists for the user
    const existingTask = await Task.findOne({ taskName, user: userId });
    if (existingTask) {
      const error = new Error(
        `A task with this name already exists: ${taskName}. Please choose a different name.`
      );
      error.statusCode = 400;
      return next(error);
    }

    // Calculate endDate based on duration and createdAt
    const createdAt = new Date();
    const endDate = new Date(createdAt.getTime() + duration * 60 * 60 * 1000); // Adding duration (in hours)

    // Create a new task
    const newTask = new Task({
      taskName,
      numberOfUnits,
      completedUnits,
      timeframe, // Timeframe (day/week/month/none)
      duration, // Add duration to the task
      user: userId, // Assign user to the task
      createdAt, // Set createdAt as the current date
      endDate, // Set the dynamically calculated endDate
    });

    // Save the task to the database
    await newTask.save();

    // Return the created task
    res.status(201).json({
      success: true,
      task: newTask,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    return next(error); // Ensure any other error is passed to the error handling middleware
  }
};

// Get all tasks for a user (with optional timeframe filter)
export const getTasks = async (req, res) => {
  const userId = req.user.userId;

  try {
    const tasks = await Task.find({ user: userId });

    res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ success: false, message: "Error fetching tasks" });
  }
};

// Get tasks filtered by timeframe (day/week/month/none)
export const getTasksByTimeframe = async (req, res) => {
  const { timeframe } = req.params; // timeframe from URL parameters
  const userId = req.user._id;

  try {
    // Validate timeframe input
    if (!["day", "week", "month", "none"].includes(timeframe)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timeframe. Must be one of: day, week, month, none.",
      });
    }

    let tasks;

    if (timeframe === "none") {
      // If "none", return all tasks for the user without any filtering
      tasks = await Task.find({ user: userId });
    } else {
      // Filter tasks based on the timeframe
      tasks = await Task.find({ user: userId, timeframe: timeframe });
    }

    res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ success: false, message: "Error fetching tasks" });
  }
};

// Get a single task by its ID
export const getTaskById = async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await Task.findOne({ taskId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Error fetching task by ID:", error);
    res.status(500).json({ success: false, message: "Error fetching task" });
  }
};

import mongoose from "mongoose";
export const updateTask = async (req, res) => {
  const { taskId } = req.params;
  const { taskName, numberOfUnits, completedUnits, endDate, timeframe } =
    req.body;

  try {
    // Convert taskId to ObjectId
    const task = await Task.findOne({
      _id: new mongoose.Types.ObjectId(taskId),
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    // Check if the task name is being updated and if it already exists for other tasks
    if (taskName && task.taskName !== taskName) {
      const existingTask = await Task.findOne({ taskName });
      if (existingTask) {
        return res.status(400).json({
          success: false,
          message: `A task with the name "${taskName}" already exists. Please choose a different name.`,
        });
      }
    }

    // Update task properties
    task.taskName = taskName || task.taskName;
    task.numberOfUnits = numberOfUnits || task.numberOfUnits;
    task.completedUnits = completedUnits || task.completedUnits;
    task.endDate = endDate || task.endDate;
    task.timeframe = timeframe || task.timeframe;
    task.updatedAt = Date.now(); // Update timestamp

    // Save the updated task
    await task.save();

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ success: false, message: "Error updating task" });
  }
};
export const updateCompletedUnits = async (req, res) => {
  const { taskId } = req.params;
  const { completedUnits } = req.body;

  try {
    // Convert taskId to ObjectId and find the task
    const task = await Task.findOne({
      _id: new mongoose.Types.ObjectId(taskId),
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    // Validate that completedUnits is provided and is a number
    if (completedUnits === undefined || typeof completedUnits !== "number") {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid value for completedUnits.",
      });
    }

    // Update the completedUnits field
    task.completedUnits = completedUnits;

    // Update the updatedAt timestamp
    task.updatedAt = Date.now();

    // Save the updated task
    await task.save();

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Error updating completed units:", error);
    res.status(500).json({ success: false, message: "Error updating task" });
  }
};
export const updateTaskPriority = async (req, res) => {
  const { taskId } = req.params; // Get the taskId from the URL
  const { priority } = req.body; // Get the priority from the request body

  try {
    // Check if the priority is a valid number
    if (typeof priority !== "number" || priority < 0) {
      return res.status(400).json({
        success: false,
        message: "Priority must be a valid number and cannot be negative.",
      });
    }

    // Find the task by taskId (using ObjectId for safe querying)
    const task = await Task.findOne({
      _id: new mongoose.Types.ObjectId(taskId),
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    // Update the task's priority
    task.priority = priority;

    // Update the updatedAt timestamp
    task.updatedAt = Date.now();

    // Save the updated task
    await task.save();

    res.status(200).json({
      success: true,
      message: "Task priority updated successfully",
      task,
    });
  } catch (error) {
    console.error("Error updating task priority:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating task priority" });
  }
};
// Delete a task
export const deleteTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    // Use findByIdAndDelete for a more efficient delete operation
    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ success: false, message: "Error deleting task" });
  }
};

// Move a task (for example, changing its status or timeframe)
export const moveTask = async (req, res) => {
  const { taskId } = req.params;
  const { status, timeframe } = req.body;

  try {
    const task = await Task.findOne({ taskId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    // Update the task's status and/or timeframe
    if (status) task.status = status;
    if (timeframe) task.timeframe = timeframe;
    task.updatedAt = Date.now(); // Update timestamp

    // Save the updated task
    await task.save();

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Error moving task:", error);
    res.status(500).json({ success: false, message: "Error moving task" });
  }
};
export const updateStartAndEndTimes = async (req, res) => {
  const { taskId } = req.params; // Extract taskId from URL parameters
  const { startTime, endTime } = req.body; // Extract the new startTime and endTime from the request body

  try {
    // Validate the start and end times
    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Both startTime and endTime are required.",
      });
    }

    // Convert the startTime and endTime to Date objects
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Log the parsed start and end times to see if they are being parsed correctly
    console.log("Parsed startTime:", start);
    console.log("Parsed endTime:", end);

    // Check if the startTime is later than endTime
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "startTime must be earlier than endTime.",
      });
    }

    // Find the task by taskId
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    // Update the task's startTime and endTime
    task.createdAt = start;
    task.endDate = end;
    task.updatedAt = Date.now(); // Update the timestamp

    // Save the updated task
    await task.save();

    // Return the updated task
    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Error updating startTime and endTime:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating task times" });
  }
};
