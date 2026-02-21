"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import {
  Card,
  FieldStack,
  HeaderTitles,
  Input,
  Label,
  ListStack,
  MutedText,
  PageHeader,
  PageStack,
  PrimaryButton,
  Select,
  Subtitle,
  Title
} from "./ui";

const Row = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--space-12);

  &:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }
`;

export default function FamilyView() {
  const params = useSearchParams();
  const inviteToken = useMemo(() => params.get("invite") || "", [params]);
  const [me, setMe] = useState(null);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [message, setMessage] = useState("");

  const isManager = me?.role === "manager" || me?.role === "admin";

  async function load() {
    const [meRes, membersRes, invitesRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/household/members"),
      fetch("/api/household/invites")
    ]);

    if (meRes.ok) {
      const meData = await meRes.json();
      setMe(meData.user);
    }
    if (membersRes.ok) {
      const membersData = await membersRes.json();
      setMembers(membersData.items || []);
    }
    if (invitesRes.ok) {
      const invitesData = await invitesRes.json();
      setInvites(invitesData.items || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function sendInvite(e) {
    e.preventDefault();
    setMessage("");

    const res = await fetch("/api/household/invites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage("Could not send invite.");
      return;
    }

    setInviteEmail("");
    setInviteRole("member");
    setMessage(
      body.inviteUrl
        ? `Invite email sent. Direct link (for testing): ${body.inviteUrl}`
        : "Invite email sent."
    );
    load();
  }

  async function acceptInvite() {
    if (!inviteToken) return;
    setMessage("");
    const res = await fetch("/api/household/invites/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: inviteToken })
    });
    if (!res.ok) {
      setMessage("Invite token is invalid or email does not match this account.");
      return;
    }
    setMessage("Invite accepted. Your account joined this family.");
    load();
  }

  return (
    <PageStack>
      <PageHeader>
        <HeaderTitles>
          <Title>Family</Title>
          <Subtitle>Invite parents or kids, and manage your shared meal planning household.</Subtitle>
        </HeaderTitles>
      </PageHeader>

      {inviteToken ? (
        <Card>
          <Title style={{ fontSize: 18 }}>Join Family Invite</Title>
          <MutedText style={{ marginTop: 8 }}>
            Accept this invite using your currently logged-in account.
          </MutedText>
          <div style={{ marginTop: 12 }}>
            <PrimaryButton type="button" onClick={acceptInvite}>
              Accept Invite
            </PrimaryButton>
          </div>
        </Card>
      ) : null}

      {isManager ? (
        <Card>
          <Title style={{ fontSize: 18 }}>Invite Family Member</Title>
          <form onSubmit={sendInvite} style={{ marginTop: 12 }}>
            <FieldStack>
              <Label htmlFor="inviteEmail">Email</Label>
              <Input
                id="inviteEmail"
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="kid@example.com"
              />
            </FieldStack>
            <FieldStack style={{ marginTop: 12 }}>
              <Label htmlFor="inviteRole">Role</Label>
              <Select
                id="inviteRole"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="member">Member</option>
                <option value="manager">Family Manager</option>
              </Select>
            </FieldStack>
            <div style={{ marginTop: 12 }}>
              <PrimaryButton type="submit">Send Invite</PrimaryButton>
            </div>
          </form>
          {message ? <MutedText style={{ marginTop: 12 }}>{message}</MutedText> : null}
        </Card>
      ) : null}

      <Card>
        <Title style={{ fontSize: 18 }}>Members</Title>
        <ListStack style={{ marginTop: 12 }}>
          {members.map((member) => (
            <Row key={member.id}>
              <strong>{member.displayName}</strong>
              <MutedText>
                {member.email} {member.username ? `(@${member.username})` : ""}
              </MutedText>
              <MutedText>
                Role: {member.role} | Verified: {member.emailVerifiedAt ? "yes" : "no"}
              </MutedText>
            </Row>
          ))}
        </ListStack>
      </Card>

      <Card>
        <Title style={{ fontSize: 18 }}>Invites</Title>
        {invites.length === 0 ? (
          <MutedText style={{ marginTop: 12 }}>No invites yet.</MutedText>
        ) : (
          <ListStack style={{ marginTop: 12 }}>
            {invites.map((invite) => (
              <Row key={invite.id}>
                <strong>{invite.email}</strong>
                <MutedText>Role: {invite.role}</MutedText>
                <MutedText>
                  {invite.acceptedAt
                    ? `Accepted ${new Date(invite.acceptedAt).toLocaleString()}`
                    : `Expires ${new Date(invite.expiresAt).toLocaleString()}`}
                </MutedText>
              </Row>
            ))}
          </ListStack>
        )}
      </Card>
    </PageStack>
  );
}
