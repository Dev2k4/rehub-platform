import { Box, Flex } from "@chakra-ui/react";
import type { CategoryTree } from "@/client";
import {
  FiSmartphone,
  FiMonitor,
  FiTv,
  FiPackage,
  FiBox,
  FiShoppingBag,
  FiBook,
  FiSmile,
  FiHome,
  FiWatch,
  FiCamera,
  FiMusic,
  FiActivity,
  FiHeart,
  FiTag,
} from "react-icons/fi";
import React from "react";

// Icon mappings by category name keywords
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "điện thoại": FiSmartphone,
  laptop: FiMonitor,
  "máy tính": FiMonitor,
  tivi: FiTv,
  "tủ lạnh": FiPackage,
  "máy giặt": FiBox,
  "xe máy": FiActivity,
  "ô tô": FiActivity,
  "xe đạp": FiActivity,
  "quần áo": FiShoppingBag,
  "thời trang": FiShoppingBag,
  giày: FiShoppingBag,
  túi: FiShoppingBag,
  sách: FiBook,
  "đồ chơi": FiSmile,
  "trẻ em": FiSmile,
  "nội thất": FiHome,
  "bàn ghế": FiHome,
  "nhà bếp": FiHome,
  "đồng hồ": FiWatch,
  camera: FiCamera,
  "âm nhạc": FiMusic,
  "thể thao": FiActivity,
  "sức khỏe": FiHeart,
  "làm đẹp": FiHeart,
  pet: FiHeart,
  "thú cưng": FiHeart,
  garden: FiHome,
  "cây cảnh": FiHome,
};

const CATEGORY_COLORS: string[] = [
  "#DBEAFE", // blue-100
  "#FCE7F3", // pink-100
  "#D1FAE5", // green-100
  "#FEF3C7", // amber-100
  "#EDE9FE", // violet-100
  "#FFEDD5", // orange-100
  "#CFFAFE", // cyan-100
  "#F3F4F6", // gray-100
];

function getCategoryIcon(name: string): React.ElementType {
  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lowerName.includes(key)) return icon;
  }
  return FiTag; // fallback
}

type CategoryQuickAccessProps = {
  categories: CategoryTree[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
};

export function CategoryQuickAccess({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryQuickAccessProps) {
  if (!categories || categories.length === 0) return null;

  // Show root categories only (max 12)
  const rootCats = categories.filter((c) => !c.parent_id).slice(0, 12);

  return (
    <Box mb="1.75rem">
      <Flex
        gap={{ base: "0.5rem", md: "0.75rem" }}
        overflowX="auto"
        pb="0.5rem"
        className="scrollbar-hide"
        flexWrap={{ base: "nowrap", md: "wrap" }}
      >
        {/* All categories pill */}
        <CategoryPill
          name="Tất cả"
          icon={FiShoppingBag}
          color={selectedCategoryId === "" ? "#DBEAFE" : "#F9FAFB"}
          isActive={selectedCategoryId === ""}
          onClick={() => onSelectCategory("")}
        />

        {rootCats.map((cat, idx) => (
          <CategoryPill
            key={cat.id}
            name={cat.name}
            icon={getCategoryIcon(cat.name)}
            color={
              selectedCategoryId === cat.id
                ? "#DBEAFE"
                : CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
            }
            isActive={selectedCategoryId === cat.id}
            onClick={() => onSelectCategory(cat.id)}
          />
        ))}
      </Flex>
    </Box>
  );
}

function CategoryPill({
  name,
  icon: Icon,
  color,
  isActive,
  onClick,
}: {
  name: string;
  icon: React.ElementType;
  color: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      as="button"
      onClick={onClick}
      display="flex"
      alignItems="center"
      gap="0.4rem"
      px="0.875rem"
      py="0.5rem"
      bg={color}
      border={isActive ? "2px solid #3B82F6" : "2px solid transparent"}
      borderRadius="999px"
      fontWeight={isActive ? "700" : "600"}
      fontSize={{ base: "0.78rem", md: "0.85rem" }}
      color={isActive ? "#1D4ED8" : "#374151"}
      cursor="pointer"
      whiteSpace="nowrap"
      flexShrink={0}
      transition="all 0.2s ease"
      style={{
        boxShadow: isActive ? "0 0 0 3px rgba(59, 130, 246, 0.15)" : "none",
      }}
      _hover={{
        transform: "translateY(-2px)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <Box as="span" fontSize="1rem" lineHeight="1">
        <Icon />
      </Box>
      <Box as="span">{name}</Box>
    </Box>
  );
}
