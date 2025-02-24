import Category from "../model/CategorySchema.js";
import Task from "../model/TaskSchema.js"; // For referencing tasks

// Create a new category with parent task, children, and color
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

    // Check if the parent task exists
    const parentTask = await Task.findOne({ _id: parent_task, user: userId });
    if (!parentTask) {
      return res.status(404).json({
        success: false,
        message: "Parent task not found or does not belong to the user.",
      });
    }

    // Check if the children tasks exist
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

//getting all the data
export const getCategories = async (req, res) => {
  const userId = req.user.userId;

  try {
    const categories = await Category.find({}).populate("parent_task children");

    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching categories" });
  }
};
// updatin the  color and children
export const updateCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { color, children } = req.body;
  const userId = req.user.userId;

  try {
    // Find the category
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
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

    // Update color and children
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
    res
      .status(500)
      .json({ success: false, message: "Error updating category" });
  }
};
// Delete the category
export const deleteCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    // Find the category
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // Optionally handle task deletion or reassignment for the parent task or children tasks

    // Delete the category
    await category.remove();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res
      .status(500)
      .json({ success: false, message: "Error deleting category" });
  }
};
