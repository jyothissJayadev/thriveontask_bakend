import Category from "../model/CategorySchema.js";
import Task from "../model/TaskSchema.js"; // For referencing tasks
import mongoose from "mongoose";
export const createCategory = async (req, res, next) => {
  const { name, description, parent_task, children, color } = req.body;
  const userId = req.user.userId;

  try {
    // Validate required fields
    if (!name || !parent_task || !color) {
      return res.status(400).json({
        success: false,
        message: "Name, parent task, and color are required.",
      });
    }

    // Check if the parent task exists and belongs to the user
    const parentTask = await Task.findOne({ _id: parent_task, user: userId });
    if (!parentTask) {
      return res.status(404).json({
        success: false,
        message: "Parent task not found or does not belong to the user.",
      });
    }

    // Check if the parent task already exists in another category
    const existingCategory = await Category.findOne({ parent_task });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message:
          "This parent task is already assigned to an existing category.",
      });
    }

    // Check if the children tasks exist and belong to the user
    const childrenTasks = await Task.find({
      _id: { $in: children },
      user: userId,
    });
    if (childrenTasks.length !== children.length) {
      return res.status(404).json({
        success: false,
        message:
          "Some or all children tasks not found or do not belong to the user.",
      });
    }

    // Create a new category
    const newCategory = new Category({
      name,
      description,
      parent_task,
      children,
      color,
      user: userId, // Associate category with the user
    });

    // Save the category
    await newCategory.save();

    res.status(201).json({
      success: true,
      category: newCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return next(error);
  }
};

export const getCategories = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Fetch categories belonging to the user and populate the parent_task and children with task details
    const categories = await Category.find({ user: userId }) // Ensure categories belong to the user
      .populate({
        path: "parent_task",
        select: "taskName numberOfUnits completedUnits createdAt endDate", // Include the necessary task details
      })
      .populate({
        path: "children",
        select: "taskName numberOfUnits completedUnits createdAt endDate", // Include the necessary task details
      });

    // Check if categories are found
    if (!categories.length) {
      return res.status(404).json({
        success: false,
        message: "No categories found for this user.",
      });
    }

    // Return the populated categories
    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
    });
  }
};

// updatin the  color and children
export const updateCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { color, children } = req.body;
  const userId = req.user.userId;

  try {
    // Find the category by ID
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // Ensure the category belongs to the user
    if (category.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this category.",
      });
    }

    // Check if the new children tasks exist and belong to the user
    const childrenTasks = await Task.find({
      _id: { $in: children },
      user: userId,
    });
    if (childrenTasks.length !== children.length) {
      return res.status(404).json({
        success: false,
        message:
          "Some or all children tasks not found or do not belong to the user.",
      });
    }

    // Update category's color and children
    category.color = color || category.color;
    category.children = children || category.children;

    // Save the updated category
    await category.save();

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      message: "Error updating category",
    });
  }
};

export const deleteCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    // Validate categoryId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });
    }

    // Find the category by ID
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // Delete the category
    await Category.findByIdAndDelete(categoryId);

    // Send success response
    res.status(200).json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting category.",
    });
  }
};
