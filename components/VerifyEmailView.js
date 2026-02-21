"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, MutedText, PageStack, PrimaryButton, Title } from "./ui";

export default function VerifyEmailView() {
  const params = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [status, setStatus] = useState("working");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        setStatus("ok");
        setMessage("Email verified. You can now log in.");
      })
      .catch(() => {
        setStatus("error");
        setMessage("Verification token is invalid or expired.");
      });
  }, [token]);

  return (
    <PageStack>
      <Card>
        <Title>Email Verification</Title>
        <MutedText>{message}</MutedText>
        {status !== "working" ? (
          <div style={{ marginTop: 16 }}>
            <PrimaryButton as="a" href="/login">
              Go to Login
            </PrimaryButton>
          </div>
        ) : null}
      </Card>
    </PageStack>
  );
}
