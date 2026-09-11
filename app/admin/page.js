import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readAdminSession } from "../../lib/auth";
import AdminClient from "./AdminClient";

export default function AdminPage() {
  const session = readAdminSession(cookies());
  if (!session) {
    redirect("/admin/login");
  }
  return <AdminClient />;
}
