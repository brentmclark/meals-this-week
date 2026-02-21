"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, FieldStack, Input, Label, MutedText, PageStack, PrimaryButton, Title } from "./ui";

export default function ResetPasswordView() {
  const params = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [passcode, setPasscode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!token) {
      setMessage("Missing reset token.");
      return;
    }
    if (passcode !== confirm) {
      setMessage("Passcodes do not match.");
      return;
    }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, passcode })
    });

    if (!res.ok) {
      setMessage("Reset token is invalid or expired.");
      return;
    }

    setDone(true);
    setMessage("Passcode updated. You can now log in.");
  }

  return (
    <PageStack>
      <Card>
        <Title>Reset Passcode</Title>
        {done ? (
          <>
            <MutedText>{message}</MutedText>
            <div style={{ marginTop: 16 }}>
              <PrimaryButton as="a" href="/login">
                Go to Login
              </PrimaryButton>
            </div>
          </>
        ) : (
          <form onSubmit={onSubmit}>
            <FieldStack>
              <Label htmlFor="passcode">New Passcode</Label>
              <Input
                id="passcode"
                type="password"
                required
                minLength={8}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
              />
            </FieldStack>
            <FieldStack style={{ marginTop: 12 }}>
              <Label htmlFor="confirm">Confirm Passcode</Label>
              <Input
                id="confirm"
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </FieldStack>
            {message ? <MutedText style={{ marginTop: 12 }}>{message}</MutedText> : null}
            <div style={{ marginTop: 12 }}>
              <PrimaryButton type="submit">Save New Passcode</PrimaryButton>
            </div>
          </form>
        )}
      </Card>
    </PageStack>
  );
}
