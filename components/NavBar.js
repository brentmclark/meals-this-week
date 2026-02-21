"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styled from "styled-components";
import { Button } from "./ui";
import BrandLogo from "./BrandLogo";

const links = [
  ["/", "This Week"],
  ["/history", "History"],
  ["/staged", "Staged"],
  ["/family", "Family"],
  ["/display", "Kitchen Display"]
];

const Shell = styled.nav`
  display: grid;
  gap: var(--space-12);
  align-items: center;

  @media (min-width: 920px) {
    grid-template-columns: auto 1fr auto;
    column-gap: var(--space-24);
  }
`;

const BrandLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border-radius: var(--radius-control);

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const LinkGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);

  @media (min-width: 920px) {
    justify-content: center;
  }
`;

const NavLink = styled(Link)`
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  border: 1px solid ${({ $active }) => ($active ? "var(--color-accent)" : "transparent")};
  border-radius: var(--radius-control);
  padding: 0 var(--space-12);
  background: ${({ $active }) => ($active ? "var(--color-accent)" : "transparent")};
  color: ${({ $active }) => ($active ? "var(--color-accent-contrast)" : "var(--color-muted)")};
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: var(--color-accent);
    color: var(--color-text);
  }

  &:active {
    background: var(--color-border);
    border-color: var(--color-accent);
    color: var(--color-text);
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
  const isAuthPage = ["/login", "/signup", "/forgot-password", "/verify-email", "/reset-password"].includes(pathname);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <Shell>
      <BrandLink href="/" aria-label="Meals This Week home">
        <BrandLogo />
      </BrandLink>
      {!isAuthPage ? (
        <>
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
        </>
      ) : null}
    </Shell>
  );
}
