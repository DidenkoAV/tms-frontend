// Application router configuration
import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/app/layouts/AppLayout";
import PrivateOutlet from "@/app/guards/PrivateOutlet";
import AdminOutlet from "@/app/guards/AdminOutlet";

// Pages
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ProjectOverviewPage from "@/pages/ProjectOverviewPage";
import TestCasesPage from "@/pages/TestCasesPage";
import RunsPage from "@/pages/RunsPage";
import AccountPage from "@/pages/AccountPage";
import CaseEditorPage from "@/pages/CaseEditorPage";
import CaseViewPage from "@/pages/CaseViewPage";
import RunPage from "@/pages/RunPage";
import ProjectLayout from "@/pages/ProjectLayout";
import MilestonesPage from "@/pages/MilestonesPage";
import MilestonePage from "@/pages/MilestonePage";
import RegisterPage from "@/pages/RegisterPage";
import CheckEmailPage from "@/pages/CheckEmailPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import ConfirmEmailPage from "@/pages/ConfirmEmailPage";
import InviteAcceptedPage from "@/pages/InviteAcceptedPage";
import AdminPage from "@/pages/AdminPage";
import DebugMePage from "@/pages/DebugMePage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />, // Provides Outlet context: { authed, me, onLogout }
    children: [
      // Public routes
      { index: true, element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "check-email", element: <CheckEmailPage /> },
      { path: "verify", element: <VerifyEmailPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
      { path: "confirm-email", element: <ConfirmEmailPage /> },

      // Public group invite acceptance page
      { path: "invite/accepted", element: <InviteAcceptedPage /> },

      // Private routes (protected by PrivateOutlet)
      {
        element: <PrivateOutlet />,
        children: [
          { path: "dashboard", element: <DashboardPage /> },
          { path: "projects", element: <ProjectsPage /> },

          {
            path: "projects/:id",
            element: <ProjectLayout />,
            children: [
              { index: true, element: <ProjectOverviewPage /> },
              { path: "test-cases", element: <TestCasesPage /> },
              { path: "cases/new", element: <CaseEditorPage /> },
              { path: "cases/:caseId", element: <CaseViewPage /> },
              { path: "cases/:caseId/edit", element: <CaseEditorPage /> },
              { path: "runs", element: <RunsPage /> },
              { path: "runs/:runId", element: <RunPage /> },
              { path: "milestones", element: <MilestonesPage /> },
              { path: "milestones/:milestoneId", element: <MilestonePage /> },
            ],
          },

          { path: "account", element: <AccountPage /> },
          { path: "debug-me", element: <DebugMePage /> },

          // Admin routes (protected by AdminOutlet - requires ROLE_ADMIN)
          {
            element: <AdminOutlet />,
            children: [
              { path: "admin", element: <AdminPage /> },
            ],
          },
        ],
      },
    ],
  },
]);

export default router;
export { router };
