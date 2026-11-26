import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/expeditions")({
  component: ExpeditionsLayout,
});

function ExpeditionsLayout() {
  return <Outlet />;
}
