"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  ["/", "This Week"],
  ["/history", "History"],
  ["/staged", "Staged"],
  ["/display", "Kitchen Display"]
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (pathname === "/login") return null;

  return (
    <nav>
      <div className="links">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className={`nav-link ${pathname === href ? "active" : ""}`}>
            {label}
          </Link>
        ))}
      </div>
      <button onClick={logout}>Logout</button>
    </nav>
  );
}
