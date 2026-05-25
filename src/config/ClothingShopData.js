export const CLOTHING_SHOP_ITEMS = [
  { key: "white_tshirt", label: "반팔 티셔츠", category: "top", price: 12000, texture: "shop_white_tshirt" },
  { key: "check_shirt", label: "체크 셔츠", category: "top", price: 25000, texture: "shop_check_shirt" },
  { key: "sweatshirt", label: "맨투맨", category: "top", price: 38000, texture: "shop_sweatshirt" },
  { key: "cotton_pants", label: "면바지", category: "pants", price: 29000, texture: "shop_cotton_pants" },
  { key: "jeans", label: "청바지", category: "pants", price: 45000, texture: "shop_jeans" },
  { key: "jogger_pants", label: "조거팬츠", category: "pants", price: 22000, texture: "shop_jogger_pants" },
  { key: "hoodie_jacket", label: "기본 후드집업", category: "outer", price: 39000, texture: "shop_hoodie_jacket" },
  { key: "denim_jacket", label: "청자켓", category: "outer", price: 69000, texture: "shop_denim_jacket" },
  { key: "padded_jacket", label: "브랜드 패딩", category: "outer", price: 129000, texture: "shop_padded_jacket" },
  { key: "sneakers", label: "운동화", category: "shoes", price: 49000, texture: "shop_sneakers" },
  { key: "canvas_shoes", label: "캔버스화", category: "shoes", price: 32000, texture: "shop_canvas_shoes" },
  { key: "running_shoes", label: "브랜드 러닝화", category: "shoes", price: 89000, texture: "shop_running_shoes" },
];

export const CLOTHING_SHOP_CATEGORIES = [
  { key: "top", label: "상의" },
  { key: "pants", label: "하의" },
  { key: "outer", label: "외투" },
  { key: "shoes", label: "신발" },
];

export const CLOTHING_SHOP_CATEGORY_LABELS = Object.fromEntries(
  CLOTHING_SHOP_CATEGORIES.map((category) => [category.key, category.label]),
);
