"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import styled from "styled-components";
import { Card, FieldStack, Input, Label, MutedText, PrimaryButton, Title } from "./ui";

const Wrapper = styled.section`
  display: grid;
  place-items: start center;
  padding-top: 10vh;
`;

const LoginPanel = styled(Card)`
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

const Divider = styled.hr`
  border: 0;
  border-top: 1px solid var(--color-border);
  margin: var(--space-16) 0;
`;

const InlineLink = styled(Link)`
  color: var(--color-accent);
`;

const InlineAction = styled.button`
  background: none;
  border: 0;
  padding: 0;
  color: var(--color-accent);
  font: inherit;
  cursor: pointer;
`;

export default function LoginCard() {
  const params = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [passcode, setPasscode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [helperMessage, setHelperMessage] = useState("");
  const router = useRouter();
  const inviteToken = params.get("invite") || "";

  async function onLogin(e) {
    e.preventDefault();
    setLoginError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier, passcode })
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body.error === "identifier_required") {
        setLoginError("Email or username is required.");
      } else if (body.error === "email_not_verified") {
        setLoginError("Email is not verified yet. Use Resend verification.");
      } else if (body.error === "account_locked") {
        setLoginError("Account temporarily locked after repeated failures.");
      } else if (body.error === "rate_limited") {
        setLoginError("Too many attempts. Try again shortly.");
      } else if (body.error === "auth_config_invalid") {
        setLoginError("Auth config is invalid. Check server logs.");
      } else {
        setLoginError("Credentials did not match.");
      }
      return;
    }

    router.replace(inviteToken ? `/family?invite=${encodeURIComponent(inviteToken)}` : "/");
  }

  async function resendVerification() {
    setHelperMessage("");
    if (!identifier.trim()) {
      setLoginError("Enter email or username first.");
      return;
    }

    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoginError(body.error === "rate_limited" ? "Too many requests. Try again shortly." : "Request failed.");
      return;
    }
    setHelperMessage(
      body.verificationUrl
        ? `Verification link (dev): ${body.verificationUrl}`
        : "If account exists and is unverified, verification email was sent."
    );
  }

  return (
    <Wrapper>
      <LoginPanel>
        <Title>Meals This Week</Title>
        <MutedText>Sign in</MutedText>
        <Form onSubmit={onLogin}>
          <FieldStack>
            <Label htmlFor="identifier">Email or Username</Label>
            <Input
              id="identifier"
              type="text"
              placeholder="your@email.com or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </FieldStack>
          <FieldStack>
            <Label htmlFor="passcode">Passcode</Label>
            <Input
              id="passcode"
              type="password"
              required
              placeholder="Passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
          </FieldStack>
          {loginError ? <ErrorText>{loginError}</ErrorText> : null}
          <PrimaryButton type="submit">Log In</PrimaryButton>
        </Form>
        <Divider />
        <MutedText>
          Need an account?{" "}
          <InlineLink href={inviteToken ? `/signup?invite=${encodeURIComponent(inviteToken)}` : "/signup"}>
            Create one here
          </InlineLink>
        </MutedText>
        <MutedText>
          Forgot passcode screen: <InlineLink href="/forgot-password">Open forgot password</InlineLink>
        </MutedText>
        <MutedText>
          Email not verified? <InlineAction onClick={resendVerification}>Resend verification</InlineAction>
        </MutedText>
        {helperMessage ? <MutedText style={{ marginTop: 12 }}>{helperMessage}</MutedText> : null}
      </LoginPanel>
    </Wrapper>
  );
}
