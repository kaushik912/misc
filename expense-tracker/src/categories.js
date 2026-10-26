// Preset expense categories; "Custom…" (always last in the UI) lets the user type their own.
export const CATEGORIES = [
  "Fuel", "Rent", "Groceries", "Food & Dining", "Bills & Utilities", "Transport",
  "Health", "Shopping", "Entertainment", "Travel", "Education", "EMI/Loans",
];

export const CUSTOM = "Custom…";
export const DEFAULT_CATEGORY = "Uncategorized";

// Grouping key so "Bills", "bills " and legacy blanks land in one bucket.
export const categoryKey = (c) => (c || DEFAULT_CATEGORY).trim().toLowerCase();
