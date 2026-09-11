import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSession } from "../../lib/auth";
import { getActiveTechnician } from "../../lib/db";
import LogClient from "./LogClient";

export default async function LogPage() {
  const session = readSession(cookies());
  if (!session) {
    redirect("/login");
  }
  const technician = await getActiveTechnician(session.id);
  if (!technician) {
    redirect("/login");
  }
  return <LogClient />;
}
