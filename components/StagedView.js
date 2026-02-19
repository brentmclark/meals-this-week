"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import {
  Button,
  Card,
  FieldStack,
  HeaderActions,
  HeaderTitles,
  Input,
  Label,
  ListStack,
  MutedText,
  PageHeader,
  PageStack,
  PrimaryButton,
  Title
} from "./ui";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
`;

const ItemRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding-bottom: var(--space-12);
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-16);
  }
`;

const ItemText = styled.p`
  margin: 0;
  font-size: var(--font-small);
  overflow-wrap: anywhere;
`;

export default function StagedView() {
  const [items, setItems] = useState([]);
  const [mealName, setMealName] = useState("");
  const [note, setNote] = useState("");

  function load() {
    fetch("/api/staged")
      .then((r) => r.json())
      .then((data) => setItems(data.items || []));
  }

  useEffect(() => {
    load();
  }, []);

  async function addItem(e) {
    e.preventDefault();
    const res = await fetch("/api/staged", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mealName,
        note: note || null
      })
    });

    if (!res.ok) return;

    setMealName("");
    setNote("");
    load();
  }

  async function setStatus(id, status) {
    await fetch(`/api/staged/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status })
    });
    load();
  }

  return (
    <PageStack>
      <PageHeader>
        <HeaderTitles>
          <Title>Staged Meals</Title>
        </HeaderTitles>
      </PageHeader>

      <Card>
        <Form onSubmit={addItem}>
          <FieldStack>
            <Label htmlFor="stagedMeal">Meal to stage</Label>
            <Input
              id="stagedMeal"
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="Meal to stage"
              required
            />
          </FieldStack>
          <FieldStack>
            <Label htmlFor="stagedNote">Optional note</Label>
            <Input
              id="stagedNote"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
            />
          </FieldStack>
          <HeaderActions>
            <PrimaryButton type="submit">Add staged meal</PrimaryButton>
          </HeaderActions>
        </Form>
      </Card>

      <Card>
        {items.length === 0 ? (
          <MutedText>No staged items yet.</MutedText>
        ) : (
          <ListStack>
            {items.map((item) => (
              <ItemRow key={item.id}>
                <ItemText>
                  {item.meal_name}
                  {item.preferred_date ? ` - preferred ${item.preferred_date}` : ""}
                  {item.not_before_date ? ` - not before ${item.not_before_date}` : ""}
                </ItemText>
                <HeaderActions>
                  <Button type="button" onClick={() => setStatus(item.id, "staged")}>
                    Staged
                  </Button>
                  <Button type="button" onClick={() => setStatus(item.id, "planned")}>
                    Planned
                  </Button>
                  <Button type="button" onClick={() => setStatus(item.id, "archived")}>
                    Archive
                  </Button>
                </HeaderActions>
              </ItemRow>
            ))}
          </ListStack>
        )}
      </Card>
    </PageStack>
  );
}
