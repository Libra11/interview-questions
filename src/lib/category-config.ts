/*
 * @Author: Libra
 * @Date: 2025-11-27 14:05:30
 * @LastEditTime: 2025-11-27 14:15:48
 * @LastEditors: Libra
 * @Description:
 */
import { Layers, Network, Cpu, Globe, Code2, Box } from "lucide-react";
import {
  SiReact,
  SiVuedotjs,
  SiJavascript,
  SiTypescript,
  SiWebpack,
  SiVite,
  SiHtml5,
  SiCss3,
  SiNodedotjs,
  SiGit,
  SiDocker,
  SiNginx,
  SiGraphql,
} from "react-icons/si";
import type { ComponentType } from "react";

export interface CategoryConfigItem {
  icon: ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
}

export const CATEGORY_CONFIG: Record<string, CategoryConfigItem> = {
  React: {
    icon: SiReact,
    color: "text-[#61DAFB]",
    bg: "bg-[#61DAFB]/10",
    border: "border-[#61DAFB]/20",
  },
  Vue: {
    icon: SiVuedotjs,
    color: "text-[#4FC08D]",
    bg: "bg-[#4FC08D]/10",
    border: "border-[#4FC08D]/20",
  },
  JavaScript: {
    icon: SiJavascript,
    color: "text-[#F7DF1E]",
    bg: "bg-[#F7DF1E]/10",
    border: "border-[#F7DF1E]/20",
  },
  TypeScript: {
    icon: SiTypescript,
    color: "text-[#3178C6]",
    bg: "bg-[#3178C6]/10",
    border: "border-[#3178C6]/20",
  },
  Webpack: {
    icon: SiWebpack,
    color: "text-[#8DD6F9]",
    bg: "bg-[#8DD6F9]/10",
    border: "border-[#8DD6F9]/20",
  },
  Vite: {
    icon: SiVite,
    color: "text-[#646CFF]",
    bg: "bg-[#646CFF]/10",
    border: "border-[#646CFF]/20",
  },
  CSS: {
    icon: SiCss3,
    color: "text-[#1572B6]",
    bg: "bg-[#1572B6]/10",
    border: "border-[#1572B6]/20",
  },
  HTML: {
    icon: SiHtml5,
    color: "text-[#E34F26]",
    bg: "bg-[#E34F26]/10",
    border: "border-[#E34F26]/20",
  },
  "Node.js": {
    icon: SiNodedotjs,
    color: "text-[#339933]",
    bg: "bg-[#339933]/10",
    border: "border-[#339933]/20",
  },
  Git: {
    icon: SiGit,
    color: "text-[#F05032]",
    bg: "bg-[#F05032]/10",
    border: "border-[#F05032]/20",
  },
  Docker: {
    icon: SiDocker,
    color: "text-[#2496ED]",
    bg: "bg-[#2496ED]/10",
    border: "border-[#2496ED]/20",
  },
  Nginx: {
    icon: SiNginx,
    color: "text-[#009639]",
    bg: "bg-[#009639]/10",
    border: "border-[#009639]/20",
  },
  GraphQL: {
    icon: SiGraphql,
    color: "text-[#E10098]",
    bg: "bg-[#E10098]/10",
    border: "border-[#E10098]/20",
  },
  网络: {
    icon: Network,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  性能优化: {
    icon: Cpu,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  浏览器: {
    icon: Globe,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
  },
  算法: {
    icon: Code2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  工程化: {
    icon: Box,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
};

export const getCategoryConfig = (category: string): CategoryConfigItem => {
  // 尝试直接匹配
  if (CATEGORY_CONFIG[category]) return CATEGORY_CONFIG[category];

  // 尝试模糊匹配
  const lowerCategory = category.toLowerCase();
  const entry = Object.entries(CATEGORY_CONFIG).find(
    ([key]) =>
      lowerCategory.includes(key.toLowerCase()) ||
      key.toLowerCase().includes(lowerCategory)
  );

  if (entry) return entry[1];

  // 默认配置
  return {
    icon: Layers,
    color: "text-foreground/60",
    bg: "bg-muted/50",
    border: "border-border",
  };
};
