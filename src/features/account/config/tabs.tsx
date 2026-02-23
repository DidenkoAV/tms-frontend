import type { ReactNode } from "react";
import type { TabKey } from "@/entities/group";
import {
  UserIcon,
  Users2Icon,
  KeyIcon,
  LockIcon,
  Link2Icon,
} from "lucide-react";

export const ACCOUNT_TABS: { key: TabKey; label: string; icon: ReactNode }[] = [
  { key: "profile", label: "Profile", icon: <UserIcon className="w-4 h-4" /> },
  { key: "groups", label: "Groups", icon: <Users2Icon className="w-4 h-4" /> },
  { key: "password", label: "Password", icon: <KeyIcon className="w-4 h-4" /> },
  { key: "tokens", label: "API Tokens", icon: <LockIcon className="w-4 h-4" /> },
  { key: "integrations", label: "Integrations", icon: <Link2Icon className="w-4 h-4" /> },
];

