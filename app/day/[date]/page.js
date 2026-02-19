"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DayEditor from "../../../components/DayEditor";
import { ButtonLink, HeaderTitles, MutedText, PageHeader, PageStack, Title } from "../../../components/ui";
import { formatDay } from "../../../lib/date";

export default function DayPage({ params }) {
  const [day, setDay] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/day/${params.date}`)
      .then((r) => r.json())
      .then((data) => setDay(data));
  }, [params.date]);

  const initial = {
    nightType: day?.night_type || "normal",
    mealName: day?.meal_name || "",
    notes: day?.notes || "",
    thawReminderLabel: day?.thaw_reminder_label || "",
    thawLeadDays: day?.thaw_lead_days ?? 1
  };

  return (
    <PageStack>
      <ButtonLink href="/">Back to week</ButtonLink>
      <PageHeader>
        <HeaderTitles>
          <Title>{formatDay(params.date)}</Title>
          <MutedText>Edit meal, notes, and thaw reminder details.</MutedText>
        </HeaderTitles>
      </PageHeader>
      <DayEditor
        date={params.date}
        initial={initial}
        onSaved={(savedDay) => {
          setDay(savedDay);
          router.push("/");
        }}
      />
    </PageStack>
  );
}
