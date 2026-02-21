"use client";

import Link from "next/link";
import { useState } from "react";
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

export default function ForgotPasswordCard() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier })
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error === "rate_limited" ? "Too many requests. Try again shortly." : "Request failed.");
      return;
    }

    setMessage(body.resetUrl ? `Password reset link (dev): ${body.resetUrl}` : "If account exists, reset email was sent.");
  }

  return (
    <Wrapper>
      <Panel>
        <Title>Forgot Passcode</Title>
        <MutedText>Enter your email or username to request a reset link.</MutedText>
        <Form onSubmit={onSubmit}>
          <FieldStack>
            <Label htmlFor="identifier">Email or Username</Label>
            <Input
              id="identifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </FieldStack>
          {error ? <ErrorText>{error}</ErrorText> : null}
          <PrimaryButton type="submit">Send Reset Link</PrimaryButton>
        </Form>
        {message ? <MutedText style={{ marginTop: 12 }}>{message}</MutedText> : null}
        <MutedText style={{ marginTop: 12 }}>
          Back to <InlineLink href="/login">sign in</InlineLink>
        </MutedText>
      </Panel>
    </Wrapper>
  );
}
