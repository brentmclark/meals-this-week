"use client";

import Link from "next/link";
import styled, { css } from "styled-components";

export const PageStack = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
`;

export const PageHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: var(--space-12);

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
`;

export const HeaderTitles = styled.div`
  min-width: 0;
`;

export const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
`;

export const Title = styled.h1`
  margin: 0;
  font: var(--font-h1);
`;

export const Subtitle = styled.p`
  margin: var(--space-4) 0 0;
  font-size: var(--font-small);
  color: var(--color-muted);
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font: var(--font-h2);
`;

export const MutedText = styled.p`
  margin: 0;
  font-size: var(--font-muted);
  color: var(--color-muted);
`;

export const Card = styled.article`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: var(--space-16);
  min-width: 0;
`;

const controlStyles = css`
  width: 100%;
  min-height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-ink);
  padding: 0 var(--space-12);
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;

  &:hover {
    background: var(--color-surface-quiet);
    border-color: #c5cdc0;
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
    border-color: var(--color-accent);
  }
`;

export const Input = styled.input`
  ${controlStyles}
`;

export const Select = styled.select`
  ${controlStyles}
`;

export const TextArea = styled.textarea`
  ${controlStyles}
  min-height: 80px;
  padding-block: var(--space-8);
  resize: vertical;
`;

const buttonBase = css`
  min-height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: var(--space-4) var(--space-12);
  background: var(--color-surface);
  color: var(--color-ink);
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    background: var(--color-surface-quiet);
    border-color: #c5cdc0;
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
    border-color: var(--color-accent);
  }
`;

export const Button = styled.button`
  ${buttonBase}
`;

export const PrimaryButton = styled(Button)`
  background: var(--color-accent);
  color: #fff;
  border-color: transparent;

  &:hover {
    background: var(--color-accent-hover);
    border-color: transparent;
  }
`;

export const ButtonLink = styled(Link)`
  ${buttonBase}
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

export const FieldStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  min-width: 0;
`;

export const Label = styled.label`
  font-size: var(--font-small);
  font-weight: 600;
`;

export const InlineRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
  align-items: center;
`;

export const ListStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
`;
