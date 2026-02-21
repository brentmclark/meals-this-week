"use client";

import React from "react";
import styled from "styled-components";

const Mark = styled.svg`
  width: ${({ $compact }) => ($compact ? "34px" : "44px")};
  height: ${({ $compact }) => ($compact ? "34px" : "44px")};
  flex: 0 0 auto;
`;

const Wordmark = styled.span`
  display: ${({ $compact }) => ($compact ? "none" : "inline-flex")};
  flex-direction: column;
  line-height: 1;
  gap: 2px;
`;

const Name = styled.span`
  font-weight: 700;
  letter-spacing: 0.02em;
`;

const Tag = styled.span`
  font-size: 12px;
  color: var(--color-muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const Shell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ $compact }) => ($compact ? "0" : "10px")};
  color: inherit;
`;

export default function BrandLogo({ compact = false }) {
  return (
    <Shell $compact={compact}>
      <Mark
        $compact={compact}
        viewBox="0 0 64 64"
        role="img"
        aria-label="Meals This Week logo"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="5" y="7" width="54" height="50" rx="13" fill="#0f1520" />
        <rect x="5" y="7" width="54" height="50" rx="13" fill="url(#brandGlow)" opacity="0.95" />
        <path d="M17 23h30" stroke="#6ee7ff" strokeWidth="3" strokeLinecap="round" />
        <path d="M17 31h22" stroke="#8effc3" strokeWidth="3" strokeLinecap="round" />
        <path d="M17 39h30" stroke="#ffc880" strokeWidth="3" strokeLinecap="round" />
        <circle cx="49" cy="31" r="6" fill="#202632" stroke="#6ee7ff" strokeWidth="2" />
        <path d="M49 26v5l3 2" stroke="#6ee7ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="brandGlow" x1="7" y1="10" x2="58" y2="55" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#2a4f62" />
            <stop offset="0.5" stopColor="#2d3148" />
            <stop offset="1" stopColor="#4a3f30" />
          </linearGradient>
        </defs>
      </Mark>
      <Wordmark $compact={compact}>
        <Name>Meals This Week</Name>
        <Tag>Plan . Stage . Cook</Tag>
      </Wordmark>
    </Shell>
  );
}
