// Types for App layout and routing context
import type { Me } from "@/entities/group";

export type AppOutletCtx = {
  authed: boolean;
  me: Me | null;
  onLogout: () => void;
};
