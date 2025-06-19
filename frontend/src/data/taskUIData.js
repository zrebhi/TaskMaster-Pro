import {
  CircleIcon, // Example for To Do
  CheckCircle2Icon, // Example for Done
  ArrowDownIcon, // Low priority
  ArrowRightIcon, // Medium priority (or MinusIcon)
  ArrowUpIcon, // High priority
} from "lucide-react";

export const statuses = [
  {
    value: "to do", // Corresponds to derived status from !is_completed
    label: "To Do",
    icon: CircleIcon,
  },
  {
    value: "done", // Corresponds to derived status from is_completed
    label: "Done",
    icon: CheckCircle2Icon,
  },
  // Add other statuses if your logic derives them
  // {
  //   value: "in progress",
  //   label: "In Progress",
  //   icon: HelpCircleIcon, // Or a more fitting icon like Zap, TrendingUp
  // },
  // {
  //   value: "canceled",
  //   label: "Canceled",
  //   icon: XCircleIcon,
  // },
];

export const priorities = [
  {
    value: 1, // Matches schema: 1 for Low
    label: "Low",
    icon: ArrowDownIcon,
  },
  {
    value: 2, // Matches schema: 2 for Medium
    label: "Medium",
    icon: ArrowRightIcon, // Or MinusIcon for neutral
  },
  {
    value: 3, // Matches schema: 3 for High
    label: "High",
    icon: ArrowUpIcon,
  },
];