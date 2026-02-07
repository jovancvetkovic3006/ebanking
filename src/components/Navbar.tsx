import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import Sidebar from "./Sidebar";

export default async function Navbar() {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  const session = verifySession(token);

  if (!session) return null;

  return <Sidebar role={session.role} email={session.email ?? ""} />;
}
