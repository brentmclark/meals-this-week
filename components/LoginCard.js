"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function LoginCard() {
  const [identifier, setIdentifier] = useState("");
  const [passcode, setPasscode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [helperMessage, setHelperMessage] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [signupPasscode, setSignupPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const tokenFromUrl = params.get("invite");
    if (tokenFromUrl) setInviteToken(tokenFromUrl);
  }, [params]);

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

  async function onSignup(e) {
    e.preventDefault();
    setSignupError("");

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
      if (body.error === "username_taken") {
        setSignupError("Username is already taken.");
      } else if (body.error === "email_taken") {
        setSignupError("Email is already in use.");
      } else if (body.error === "invite_email_mismatch") {
        setSignupError("Invite token email must match signup email.");
      } else if (body.error === "invalid_invite") {
        setSignupError("Invite token is invalid or expired.");
      } else if (body.error === "rate_limited") {
        setSignupError("Too many signup attempts. Try again shortly.");
      } else if (body.error === "invalid") {
        setSignupError("Please check your signup fields and try again.");
      } else {
        setSignupError("Could not create account.");
      }
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

  async function forgotPasscode() {
    setHelperMessage("");
    if (!identifier.trim()) {
      setLoginError("Enter email or username first.");
      return;
    }

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoginError(body.error === "rate_limited" ? "Too many requests. Try again shortly." : "Request failed.");
      return;
    }
    setHelperMessage(body.resetUrl ? `Password reset link (dev): ${body.resetUrl}` : "If account exists, reset email was sent.");
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
        <MutedText>Private household planner</MutedText>
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
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <PrimaryButton type="button" onClick={forgotPasscode}>
              Forgot Passcode
            </PrimaryButton>
            <PrimaryButton type="button" onClick={resendVerification}>
              Resend Verification
            </PrimaryButton>
          </div>
        </Form>
        <Divider />
        <MutedText>Create account</MutedText>
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
              placeholder="At least 8 characters"
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
              placeholder="Repeat passcode"
              value={confirmPasscode}
              onChange={(e) => setConfirmPasscode(e.target.value)}
            />
          </FieldStack>
          {signupError ? <ErrorText>{signupError}</ErrorText> : null}
          <PrimaryButton type="submit">Create Account</PrimaryButton>
        </Form>
        {helperMessage ? <MutedText style={{ marginTop: 12 }}>{helperMessage}</MutedText> : null}
      </LoginPanel>
    </Wrapper>
  );
}
