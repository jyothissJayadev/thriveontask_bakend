import { Router } from "express";
import * as taskController from "../controller/control.js"; // Task controller
import * as categoryController from "../controller/categoryControl.js"; // Category controller
import {
  authenticateUser,
  authorizeTaskAccess,
} from "../middleware/authMiddleware.js";

const router = Router();

// All routes require authentication
router.use(authenticateUser);

// Task Routes
router.post("/tasks", taskController.createTask);
router.get("/tasks", taskController.getTasks);
router.get("/tasks/:timeframe", taskController.getTasksByTimeframe);
router.get(
  "/tasks/id/:taskId",
  authorizeTaskAccess,
  taskController.getTaskById
);
router.put("/tasks/:taskId", taskController.updateTask);
router.delete("/tasks/:taskId", taskController.deleteTask);
router.put("/tasks/:taskId/move", authorizeTaskAccess, taskController.moveTask);
router.put(
  "/tasks/:taskId/completed-units",
  taskController.updateCompletedUnits
);
// Add this route in the router.js
router.put("/tasks/:taskId/priority", taskController.updateTaskPriority);
// Add this route in the router.js
router.put("/tasks/:taskId/times", taskController.updateStartAndEndTimes);

// Category Routes
// Create a new category
router.post("/categories", categoryController.createCategory);

// Get all categories for the user
router.get("/categories", categoryController.getCategories);

// Update a category (e.g., color, children tasks)
router.put("/categories/:categoryId", categoryController.updateCategory);

// Delete a category
router.delete("/categories/:categoryId", categoryController.deleteCategory);

export default router;
