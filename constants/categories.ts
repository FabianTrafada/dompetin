export const CategoryEmojis: Record<string, string> = {
  'Salary': '💰',
  'Freelance': '💻',
  'Investment': '📈',
  'Gift': '🎁',
  'Other Income': '💵',
  'Food & Dining': '🍔',
  'Transportation': '🚗',
  'Shopping': '🛍️',
  'Entertainment': '🎬',
  'Bills & Utilities': '💡',
  'Healthcare': '🏥',
  'Education': '📚',
  'Other Expense': '💸',
};

export const getCategoryEmoji = (categoryName: string) => {
  return CategoryEmojis[categoryName] || '📝';
};
