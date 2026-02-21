"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import { Card, FieldStack, Input, Label, MutedText, PrimaryButton, Title } from "./ui";

const Wrapper = styled.section`
  display: grid;
  place-items: start center;
  padding-top: 10vh;
`;

const Panel = styled(Card)`
  width: min(100%, 430px);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  margin-top: var(--space-16);
`;

const ErrorText = styled.p`
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-small);
`;

const InlineLink = styled(Link)`
  color: var(--color-accent);
`;

export default function SignupCard() {
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [signupPasscode, setSignupPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [signupError, setSignupError] = useState("");
  const [helperMessage, setHelperMessage] = useState("");

  useEffect(() => {
    const token = params.get("invite");
    const invitedEmail = params.get("email");
    if (token) setInviteToken(token);
    if (invitedEmail) setEmail((current) => current || invitedEmail);
  }, [params]);

  async function onSignup(e) {
    e.preventDefault();
    setSignupError("");
    setHelperMessage("");

    if (signupPasscode !== confirmPasscode) {
      setSignupError("Passcodes do not match.");
      return;
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        displayName: displayName || username,
        passcode: signupPasscode,
        inviteToken: inviteToken || undefined
      })
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (body.error === "username_taken") setSignupError("Username is already taken.");
      else if (body.error === "email_taken") setSignupError("Email is already in use.");
      else if (body.error === "invite_email_mismatch") setSignupError("Invite email must match signup email.");
      else if (body.error === "invalid_invite") setSignupError("Invite token is invalid or expired.");
      else if (body.error === "rate_limited") setSignupError("Too many signup attempts. Try again shortly.");
      else setSignupError("Could not create account.");
      return;
    }

    setHelperMessage(
      body.verificationUrl
        ? `Account created. Verify email first: ${body.verificationUrl}`
        : "Account created. Check email for verification link."
    );
    setSignupPasscode("");
    setConfirmPasscode("");
  }

  return (
    <Wrapper>
      <Panel>
        <Title>Create Account</Title>
        <MutedText>Sign up for your household meal planner</MutedText>
        <Form onSubmit={onSignup}>
          <FieldStack>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              required
              minLength={3}
              maxLength={32}
              placeholder="familychef"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </FieldStack>
          <FieldStack>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FieldStack>
          <FieldStack>
            <Label htmlFor="inviteToken">Invite Token (Optional)</Label>
            <Input
              id="inviteToken"
              type="text"
              placeholder="Paste invite token if you have one"
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value)}
            />
          </FieldStack>
          <FieldStack>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Alex"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </FieldStack>
          <FieldStack>
            <Label htmlFor="signupPasscode">Passcode</Label>
            <Input
              id="signupPasscode"
              type="password"
              required
              minLength={8}
              value={signupPasscode}
              onChange={(e) => setSignupPasscode(e.target.value)}
            />
          </FieldStack>
          <FieldStack>
            <Label htmlFor="confirmPasscode">Confirm Passcode</Label>
            <Input
              id="confirmPasscode"
              type="password"
              required
              minLength={8}
              value={confirmPasscode}
              onChange={(e) => setConfirmPasscode(e.target.value)}
            />
          </FieldStack>
          {signupError ? <ErrorText>{signupError}</ErrorText> : null}
          <PrimaryButton type="submit">Create Account</PrimaryButton>
        </Form>
        {helperMessage ? <MutedText style={{ marginTop: 12 }}>{helperMessage}</MutedText> : null}
        <MutedText style={{ marginTop: 12 }}>
          Already have an account? <InlineLink href="/login">Sign in</InlineLink>
        </MutedText>
      </Panel>
    </Wrapper>
  );
}
