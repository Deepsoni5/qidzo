import Navbar from "./Navbar";
import { getCurrentUserRole, getChildSession } from "@/actions/auth";
import { getChildProfile } from "@/actions/profile";

export default async function NavbarShell() {
  const [userRole, kidSession] = await Promise.all([
    getCurrentUserRole(),
    getChildSession(),
  ]);

  let kidProfile = null;

  if (kidSession?.username) {
    kidProfile = await getChildProfile(kidSession.username as string);
  }

  return (
    <Navbar
      initialUserRole={userRole}
      initialKid={kidSession}
      initialKidProfile={kidProfile}
    />
  );
}

