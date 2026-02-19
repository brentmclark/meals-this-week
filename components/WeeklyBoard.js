"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { formatDay, startOfWeek, toISODate } from "../lib/date";
import {
  Button,
  ButtonLink,
  Card,
  HeaderActions,
  HeaderTitles,
  MutedText,
  PageHeader,
  PageStack,
  SectionTitle,
  Select,
  Subtitle,
  Title
} from "./ui";

function shiftDate(input, days) {
  const d = new Date(`${input}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

function formatThaw(label, leadDays) {
  if (!label) return null;
  if (leadDays === null || leadDays === undefined) return label;
  const dayText = leadDays === 1 ? "1 day before" : `${leadDays} days before`;
  return `${label} (${dayText})`;
}

const DayGrid = styled.section`
  display: grid;
  gap: var(--space-12);
  grid-template-columns: minmax(0, 1fr);
`;

const DayCard = styled(Card)`
  padding: var(--space-12);
  background: ${({ $nightType }) => ($nightType === "quick" ? "var(--color-day-quick)" : "var(--color-day-normal)")};
`;

const DayTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-8);
`;

const DayName = styled.h3`
  margin: 0;
  font: var(--font-h2);
  font-size: 17px;
`;

const MealName = styled.p`
  margin: var(--space-12) 0 0;
  min-height: 1.2em;
  overflow-wrap: anywhere;
`;

const StagedItem = styled.p`
  margin: 0;
  font-size: var(--font-small);
  color: var(--color-muted);
  overflow-wrap: anywhere;
`;

const StagedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  margin-top: var(--space-12);
`;

export default function WeeklyBoard({ kitchenMode = false }) {
  const initialStart = useMemo(() => toISODate(startOfWeek(new Date(), 0)), []);
  const [weekStart, setWeekStart] = useState(initialStart);
  const [days, setDays] = useState([]);
  const [staged, setStaged] = useState([]);

  function load(start = weekStart) {
    fetch(`/api/week?start=${start}`)
      .then((r) => r.json())
      .then((data) => {
        setWeekStart(data.weekStart);
        setDays(data.days || []);
        setStaged(data.staged || []);
      });
  }

  useEffect(() => {
    load(initialStart);
  }, [initialStart]);

  async function setNightType(date, nightType) {
    const res = await fetch(`/api/day/${date}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nightType })
    });

    if (res.ok) load();
  }

  return (
    <PageStack>
      <Card>
        <PageHeader>
          <HeaderTitles>
            <Title>Week of {weekStart}</Title>
            <Subtitle>Central dinner plan for the household</Subtitle>
          </HeaderTitles>
          <HeaderActions>
            <Button type="button" onClick={() => load(shiftDate(weekStart, -7))}>
              Prev
            </Button>
            <Button type="button" onClick={() => load(shiftDate(weekStart, 7))}>
              Next
            </Button>
          </HeaderActions>
        </PageHeader>
      </Card>

      {days.length === 0 ? (
        <Card>
          <MutedText>No days loaded for this week yet.</MutedText>
        </Card>
      ) : (
        <DayGrid>
          {days.map((day) => (
            <DayCard key={day.date} $nightType={day.nightType}>
              <DayTop>
                <DayName>{formatDay(day.date)}</DayName>
                {kitchenMode ? null : (
                  <Select value={day.nightType} onChange={(e) => setNightType(day.date, e.target.value)}>
                    <option value="normal">Normal</option>
                    <option value="quick">Quick</option>
                  </Select>
                )}
              </DayTop>
              <MealName>{day.mealName || "No meal set."}</MealName>
              {day.thawLabel ? <MutedText>Thaw: {formatThaw(day.thawLabel, day.thawLeadDays)}</MutedText> : null}
              {kitchenMode ? null : <ButtonLink href={`/day/${day.date}`}>Edit day</ButtonLink>}
            </DayCard>
          ))}
        </DayGrid>
      )}

      {kitchenMode ? null : (
        <Card>
          <SectionTitle>Staged meal ideas</SectionTitle>
          <StagedList>
            {staged.length === 0 ? <MutedText>No staged items yet.</MutedText> : null}
            {staged.map((item) => (
              <StagedItem key={item.id}>
                {item.meal_name}
                {item.preferred_date ? ` (preferred ${item.preferred_date})` : ""}
              </StagedItem>
            ))}
          </StagedList>
        </Card>
      )}
    </PageStack>
  );
}
