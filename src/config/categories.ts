export interface Category {
  id: string;
  label: string;
}

export const categories: Category[] = [
  { id: 'audio', label: 'Speakers & Audio' },
  { id: 'phones', label: 'Mobiles & Tablets' },
  { id: 'bicycles', label: 'Bicycles' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'appliances', label: 'Home Appliances' },
  { id: 'furniture', label: 'Furniture' },
  { id: 'tools', label: 'Tools' },
  { id: 'other', label: 'Other' },
];

export const categoryMap = Object.fromEntries(categories.map(c => [c.id, c])) as Record<string, Category>;
export type CategoryId = (typeof categories)[number]['id'];
