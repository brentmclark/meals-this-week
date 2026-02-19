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
  Title
} from "./ui";

const SearchForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-8);

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-end;
  }
`;

const SearchField = styled(FieldStack)`
  flex: 1;
`;

const HistoryItem = styled.p`
  margin: 0;
  font-size: var(--font-small);
  overflow-wrap: anywhere;
`;

export default function HistoryView() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);

  function load(nextQ = q) {
    fetch(`/api/history?q=${encodeURIComponent(nextQ)}`)
      .then((r) => r.json())
      .then((data) => setItems(data.items || []));
  }

  useEffect(() => {
    load("");
  }, []);

  return (
    <PageStack>
      <PageHeader>
        <HeaderTitles>
          <Title>Meal History</Title>
        </HeaderTitles>
      </PageHeader>

      <Card>
        <SearchForm
          onSubmit={(e) => {
            e.preventDefault();
            load(q);
          }}
        >
          <SearchField>
            <Label htmlFor="historySearch">Search by meal</Label>
            <Input
              id="historySearch"
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by meal"
            />
          </SearchField>
          <HeaderActions>
            <Button type="submit">Search</Button>
            <Button
              type="button"
              onClick={() => {
                setQ("");
                load("");
              }}
            >
              Clear
            </Button>
          </HeaderActions>
        </SearchForm>
      </Card>

      <Card>
        {items.length === 0 ? (
          <MutedText>No history yet.</MutedText>
        ) : (
          <ListStack>
            {items.map((item) => (
              <HistoryItem key={item.id}>
                {item.occurred_on}: {item.meal_name}
              </HistoryItem>
            ))}
          </ListStack>
        )}
      </Card>
    </PageStack>
  );
}
