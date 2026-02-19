"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import {
  Card,
  FieldStack,
  InlineRow,
  Input,
  Label,
  MutedText,
  PrimaryButton,
  Select,
  TextArea
} from "./ui";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const NumberInput = styled(Input)`
  width: 90px;
`;

export default function DayEditor({ date, initial, onSaved }) {
  const [nightType, setNightType] = useState(initial?.nightType || "normal");
  const [mealName, setMealName] = useState(initial?.mealName || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [thawMode, setThawMode] = useState(initial?.thawReminderLabel ? "custom" : "none");
  const [thawReminderLabel, setThawReminderLabel] = useState(initial?.thawReminderLabel || "");
  const [thawLeadDays, setThawLeadDays] = useState(initial?.thawLeadDays ?? 1);

  useEffect(() => {
    setNightType(initial?.nightType || "normal");
    setMealName(initial?.mealName || "");
    setNotes(initial?.notes || "");
    setThawMode(initial?.thawReminderLabel ? "custom" : "none");
    setThawReminderLabel(initial?.thawReminderLabel || "");
    setThawLeadDays(initial?.thawLeadDays ?? 1);
  }, [initial]);

  async function save(e) {
    e.preventDefault();
    const trimmedMealName = mealName.trim();
    const trimmedCustomLabel = thawReminderLabel.trim();
    const isNoReminder = thawMode === "none";
    const reminderLabel =
      thawMode === "meal" ? trimmedMealName : thawMode === "custom" ? trimmedCustomLabel : null;

    if (!isNoReminder && !reminderLabel) {
      alert("Enter a thaw reminder label or choose No thaw reminder.");
      return;
    }

    const res = await fetch(`/api/day/${date}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        nightType,
        mealName,
        notes,
        thawReminderLabel: isNoReminder ? null : reminderLabel,
        thawLeadDays: isNoReminder ? null : thawLeadDays
      })
    });

    if (!res.ok) {
      alert("Save failed");
      return;
    }

    const data = await res.json();
    if (onSaved) onSaved(data);
  }

  return (
    <Card>
      <Form onSubmit={save}>
        <FieldStack>
          <Label htmlFor="nightType">Night Type</Label>
          <Select id="nightType" value={nightType} onChange={(e) => setNightType(e.target.value)}>
            <option value="normal">Normal night</option>
            <option value="quick">Quick night</option>
          </Select>
        </FieldStack>

        <FieldStack>
          <Label htmlFor="mealName">Dinner Name</Label>
          <Input
            id="mealName"
            type="text"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder="Dinner name"
          />
        </FieldStack>

        <FieldStack>
          <Label htmlFor="notes">Notes</Label>
          <TextArea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            rows={3}
          />
        </FieldStack>

        <FieldStack>
          <Label htmlFor="thawMode">Thaw Reminder</Label>
          <Select id="thawMode" value={thawMode} onChange={(e) => setThawMode(e.target.value)}>
            <option value="none">No thaw reminder</option>
            <option value="meal">Use meal name</option>
            <option value="custom">Custom reminder label</option>
          </Select>
        </FieldStack>

        {thawMode === "custom" ? (
          <FieldStack>
            <Label htmlFor="thawReminderLabel">Custom Reminder Label</Label>
            <Input
              id="thawReminderLabel"
              type="text"
              value={thawReminderLabel}
              onChange={(e) => setThawReminderLabel(e.target.value)}
              placeholder="Reminder label (example: Potato and ham soup)"
            />
          </FieldStack>
        ) : null}

        {thawMode === "none" ? null : (
          <FieldStack>
            <Label htmlFor="thawLeadDays">Reminder Lead Time</Label>
            <InlineRow>
              <MutedText as="span">Remind me</MutedText>
              <NumberInput
                id="thawLeadDays"
                type="number"
                min={0}
                max={14}
                value={thawLeadDays}
                onChange={(e) => setThawLeadDays(Math.max(0, Number(e.target.value) || 0))}
              />
              <MutedText as="span">day(s) before</MutedText>
            </InlineRow>
          </FieldStack>
        )}

        <Actions>
          <PrimaryButton type="submit">Save</PrimaryButton>
        </Actions>
      </Form>
    </Card>
  );
}
