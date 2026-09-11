import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSession } from "../lib/auth";
import { getActiveTechnician } from "../lib/db";
import InspectionForm from "./InspectionFormClient";

export default async function Home() {
  const session = readSession(cookies());
  if (!session) {
    redirect("/login");
  }
  const technician = await getActiveTechnician(session.id);
  if (!technician) {
    redirect("/login");
  }
  return <InspectionForm technicianName={technician.name} />;
}
