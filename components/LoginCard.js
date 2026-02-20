"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function LoginCard() {
  const [identifier, setIdentifier] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier, passcode })
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body.error === "identifier_required") {
        setError("User is required when multi-user auth is enabled.");
      } else if (body.error === "auth_config_invalid") {
        setError("Auth user config is invalid. Check server logs.");
      } else {
        setError("Credentials did not match.");
      }
      return;
    }

    router.replace("/");
  }

  return (
    <Wrapper>
      <LoginPanel>
        <Title>Meals This Week</Title>
        <MutedText>Private household planner</MutedText>
        <Form onSubmit={onSubmit}>
          <FieldStack>
            <Label htmlFor="identifier">User</Label>
            <Input
              id="identifier"
              type="text"
              placeholder="email or login"
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
          {error ? <ErrorText>{error}</ErrorText> : null}
          <PrimaryButton type="submit">Enter</PrimaryButton>
        </Form>
      </LoginPanel>
    </Wrapper>
  );
}
