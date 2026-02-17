"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DayEditor from "../../../components/DayEditor";
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
    <section>
      <p className="muted">
        <Link href="/">Back to week</Link>
      </p>
      <h1>{formatDay(params.date)}</h1>
      <DayEditor
        date={params.date}
        initial={initial}
        onSaved={(savedDay) => {
          setDay(savedDay);
          router.push("/");
        }}
      />
    </section>
  );
}
