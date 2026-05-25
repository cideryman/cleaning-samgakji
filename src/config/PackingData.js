export const PACKING_CATEGORIES = [
  { key: "clothes", label: "옷" },
  { key: "toiletries", label: "세면도구" },
  { key: "electronics", label: "전자기기" },
  { key: "etc", label: "기타" },
];

export const PACKING_CATEGORY_LABELS = Object.fromEntries(
  PACKING_CATEGORIES.map((category) => [category.key, category.label]),
);

export const PACKING_ITEMS = [
  { key: "socks", label: "양말", category: "clothes", icon: "socks.png" },
  { key: "underwear", label: "속옷", category: "clothes", icon: "underwear.png" },
  { key: "pajamas", label: "잠옷", category: "clothes", icon: "pajamas.png" },
  { key: "towel", label: "수건", category: "toiletries", icon: "towel.png" },
  { key: "toothbrush", label: "칫솔", category: "toiletries", icon: "toothbrush.png" },
  { key: "toothpaste", label: "치약", category: "toiletries", icon: "toothpaste.png" },
  { key: "cosmetics", label: "화장품", category: "toiletries", icon: "cosmetics.png" },
  { key: "razor", label: "면도기", category: "toiletries", icon: "razor.png" },
  { key: "phone", label: "휴대폰", category: "electronics", icon: "phone.png" },
  { key: "charger", label: "충전기", category: "electronics", icon: "charger.png" },
  { key: "earphones", label: "이어폰", category: "electronics", icon: "earphones.png" },
  { key: "power_bank", label: "보조배터리", category: "electronics", icon: "power-bank.png" },
  { key: "wallet", label: "지갑", category: "etc", icon: "wallet.png" },
  { key: "transit_card", label: "교통카드", category: "etc", icon: "transit-card.png" },
  { key: "wet_tissue", label: "물티슈", category: "etc", icon: "wet-tissue.png" },
  { key: "water", label: "물", category: "etc", icon: "water.png" },
  { key: "snack", label: "간식", category: "etc", icon: "snack.png" },
  { key: "umbrella", label: "우산", category: "etc", icon: "umbrella.png" },
  { key: "medicine_bag", label: "약봉투", category: "etc", icon: "medicine-bag.png" },
];
