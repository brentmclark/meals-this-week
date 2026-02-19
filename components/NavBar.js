"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styled from "styled-components";
import { Button } from "./ui";

const links = [
  ["/", "This Week"],
  ["/history", "History"],
  ["/staged", "Staged"],
  ["/display", "Kitchen Display"]
];

const Shell = styled.nav`
  display: flex;
  flex-direction: column;
  gap: var(--space-12);

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

const LinkGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
`;

const NavLink = styled(Link)`
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  border: 1px solid ${({ $active }) => ($active ? "#b8d5bf" : "transparent")};
  border-radius: var(--radius-control);
  padding: 0 var(--space-12);
  background: ${({ $active }) => ($active ? "var(--color-accent-soft)" : "transparent")};
  color: ${({ $active }) => ($active ? "var(--color-ink)" : "var(--color-muted)")};
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    background: var(--color-surface-quiet);
    border-color: var(--color-border);
    color: var(--color-ink);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
    border-color: var(--color-accent);
  }
`;

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (pathname === "/login") return null;

  return (
    <Shell>
      <LinkGroup>
        {links.map(([href, label]) => (
          <NavLink key={href} href={href} $active={pathname === href}>
            {label}
          </NavLink>
        ))}
      </LinkGroup>
      <Button type="button" onClick={logout}>
        Logout
      </Button>
    </Shell>
  );
}
