// Types for App layout and routing context

export type AppOutletCtx = {
  authed: boolean;
  me: { fullName?: string | null; email?: string | null } | null;
  onLogout: () => void;
};

