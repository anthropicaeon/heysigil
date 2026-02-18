# UX Psychology Playbook for Web3 / SaaS Frontends

> **Purpose**: Reference guide for AI agents and developers. Apply these behavioral design patterns when building frontends to increase conversion, engagement, and task completion.

---

## 1. Fitts's Law — Make Targets Easy to Hit

**Principle**: Time to hit a target = f(distance, size). Larger, closer targets are faster to click.

**Implementation**:
- Minimum **44px touch targets** on all interactive elements (Apple HIG standard)
- Primary CTAs get **48–56px height** with generous padding (`16px 32px`)
- **Full-width buttons on mobile** (`width: 100%`, `min-height: 52px`)
- **Sticky CTAs** at bottom of viewport on mobile for important actions

```css
button {
  min-height: 44px;
  padding: 14px 28px;
}

.btn-primary {
  padding: 16px 32px; /* larger for primary actions */
}

.btn-lg {
  padding: 18px 36px;
  min-height: 56px;
}

@media (max-width: 480px) {
  .btn-primary, .btn-lg {
    width: 100%;
    min-height: 52px;
  }

  /* Sticky CTA at viewport bottom */
  .primary-flow .btn-lg {
    position: sticky;
    bottom: 16px;
    z-index: 10;
    box-shadow: var(--shadow-lg);
  }
}
```

---

## 2. Von Restorff Effect — Make Key Items Stand Out

**Principle**: The item that differs most from the rest is best remembered.

**Implementation**:
- **Subtle glow/pulse** on primary conversion CTAs
- **Gradient backgrounds** that distinguish primary from secondary buttons
- Use `::before` pseudo-element for blur glow on hover

```css
.btn-primary {
  position: relative;
  z-index: 1;
}

/* Glow on hover */
.btn-primary::before {
  content: "";
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border-radius: inherit;
  z-index: -1;
  opacity: 0;
  filter: blur(8px);
  transition: opacity 0.2s ease;
}

.btn-primary:hover::before {
  opacity: 0.5;
}

/* Emphasis variant — gentle pulse animation for key CTAs */
.btn-emphasis {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  animation: emphasisPulse 3s ease-in-out infinite;
}

@keyframes emphasisPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(var(--primary-rgb), 0); }
}
```

---

## 3. Hick's Law — Reduce Choice Paralysis

**Principle**: Decision time increases logarithmically with the number of choices.

**Implementation**:
- Show **max 3 recommended options** prominently with badges ("Fastest", "Most Secure")
- Collapse remaining options under a **"More options" toggle**
- Add **popularity percentages** or social proof to guide decisions
- Order by recommendation strength, not alphabetically

```tsx
// constants.ts
export const METHODS = [
  { id: "github_oauth", name: "GitHub OAuth", recommended: true, badge: "Fastest", popularity: 87 },
  { id: "domain_dns", name: "Domain DNS", recommended: true, badge: "Most Secure", popularity: 42 },
  { id: "tweet_zktls", name: "Tweet + zkTLS", recommended: true, badge: "No API Needed", popularity: 31 },
  // ... remaining methods have no `recommended` flag
];

export const RECOMMENDED = METHODS.filter(m => m.recommended);  // show prominently
export const OTHER = METHODS.filter(m => !m.recommended);        // collapsed

// MethodSelect.tsx
function MethodSelect({ onSelect }) {
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <h3>Recommended</h3>
      {RECOMMENDED.map(m => (
        <MethodCard key={m.id} method={m} badge={m.badge} onClick={() => onSelect(m)} />
      ))}

      <button onClick={() => setShowMore(!showMore)}>
        {showMore ? "Show less" : `More options (${OTHER.length})`}
      </button>

      {showMore && OTHER.map(m => (
        <MethodCard key={m.id} method={m} onClick={() => onSelect(m)} />
      ))}
    </>
  );
}
```

---

## 4. Miller's Law — Chunk Content into Groups of 3–5

**Principle**: Working memory holds 7±2 items. Organize into chunks for scannability.

**Implementation**:
- Structure dashboards into **3 labeled sections** (e.g., "Take Action", "Your Portfolio", "Activity")
- Each section is a self-contained cognitive chunk with its own heading
- Max **5 items visible** per section before "show more"

```tsx
// ProfileDashboard.tsx
<div className="dashboard-chunk">
  <h2 className="chunk-title">⚡ Take Action</h2>
  <FeeClaimCard />
  <PendingVerifications />
</div>

<div className="dashboard-chunk">
  <h2 className="chunk-title">📊 Your Portfolio</h2>
  <TokenGrid tokens={tokens.slice(0, 5)} />
  {tokens.length > 5 && <ShowMoreButton />}
</div>

<div className="dashboard-chunk">
  <h2 className="chunk-title">📜 Activity</h2>
  <TransactionHistory limit={5} />
</div>
```

---

## 5. Loss Aversion — Frame Potential Losses

**Principle**: People feel losses ~2x more intensely than equivalent gains.

**Implementation**:
- Frame unclaimed rewards as **potential losses**, not potential gains
- Show **expiry countdowns** ("23 days to claim" → "Claim within 7 days or fees return to protocol")
- Use **warning colors** for high-value unclaimed amounts
- Change CTA copy: "Claim" → "Claim $42.50 Now"

```tsx
function FeeClaimCard({ claimable, daysUntilExpiry }) {
  const isHighValue = claimable >= 100;
  const isNearExpiry = daysUntilExpiry <= 7;

  return (
    <div className={isHighValue ? "fee-claim-urgent" : ""}>
      <h3 style={{ color: isHighValue ? "var(--warning)" : undefined }}>
        {claimable > 0 ? "Unclaimed USDC" : "Claimable USDC"}
        {/* "Unclaimed" implies loss; "Claimable" implies gain */}
      </h3>

      {/* Urgency message scaled to amount */}
      {claimable > 0 && (
        <p className={isNearExpiry ? "urgent" : ""}>
          {isNearExpiry
            ? `Claim within ${daysUntilExpiry} days or fees return to protocol`
            : claimable >= 25
              ? "Don't leave money on the table"
              : `${daysUntilExpiry} days to claim`}
        </p>
      )}

      <button>{claimable > 0 ? `Claim $${claimable} Now` : "No USDC to Claim"}</button>
    </div>
  );
}
```

---

## 6. Zeigarnik Effect — Endowed Progress

**Principle**: People remember and are more motivated to complete **unfinished** tasks.

**Implementation**:
- Start progress bars at **20% instead of 0%** — users feel they've already begun
- Show step indicators with **checkmarks for completed steps**
- Display **"X% complete"** text alongside the progress bar

```tsx
function StepFlow({ currentStep, totalSteps }) {
  // Start at 20% to create endowed progress
  const progress = 20 + (currentStep / (totalSteps - 1)) * 80;

  return (
    <div className="progress-container">
      <div className="progress-header">
        <span>Step {currentStep + 1} of {totalSteps}</span>
        <span>{Math.round(progress)}% complete</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Step indicators with completion marks */}
      <div className="steps">
        {labels.map((label, i) => (
          <div className={`step ${i === currentStep ? "active" : ""} ${i < currentStep ? "completed" : ""}`}>
            <span className="step-number">{i < currentStep ? "✓" : i + 1}</span>
            <span className="step-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 7. Serial Position Effect — Primacy & Recency

**Principle**: Items at the **beginning** and **end** of a list are remembered better than the middle.

**Implementation**:
- Place the **most important action first** in navigation (e.g., "Verify" or primary CTA)
- Place **Sign In / Account last** (high recency)
- De-emphasize middle items visually

```tsx
// LayoutInner.tsx — nav ordering
<nav>
  <NavLink to="/verify" className="nav-link-primary">Verify</NavLink>  {/* FIRST = primacy */}
  <NavLink to="/developers">Developers</NavLink>                       {/* middle */}
  <NavLink to="/governance">Governance</NavLink>                        {/* middle */}
  <NavLink to="/profile">Sign In</NavLink>                              {/* LAST = recency */}
</nav>
```

```css
.nav-link-primary {
  color: var(--primary);
  font-weight: 600;
}
```

---

## 8. Peak–End Rule — End on a High Note

**Principle**: People judge experiences by the **peak intensity** and the **end**, not the average.

**Implementation**:
- Create a **celebration moment** on task completion (achievement card with glow animation)
- Include **share buttons** (Twitter, copy link) — turns success into social proof
- Show **concrete benefits** of what they just accomplished
- Use positive language: "You're verified!" not "Verification complete"

```tsx
function SuccessStep({ project }) {
  return (
    <div className="result-stamp-section">
      {/* Achievement card with subtle glow */}
      <div className="stamp-card stamp-card-glow">
        <div className="stamp-icon">✓</div>
        <h2>You're Verified!</h2>
        <p>{project} is now on-chain</p>
      </div>

      {/* Share CTA */}
      <div className="share-buttons">
        <button onClick={shareToTwitter}>Share on X</button>
        <button onClick={copyLink}>Copy Link</button>
      </div>

      {/* Benefits reminder */}
      <ul className="benefits-list">
        <li>✓ Earn 80% of swap fees</li>
        <li>✓ On-chain proof of ownership</li>
        <li>✓ Governance voting power</li>
      </ul>
    </div>
  );
}
```

```css
@keyframes stampGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(var(--success-rgb), 0.1); }
  50% { box-shadow: 0 0 40px rgba(var(--success-rgb), 0.2); }
}

.stamp-card-glow {
  animation: stampGlow 2s ease-in-out infinite;
}
```

---

## 9. Social Proof — Show Others Are Doing It

**Principle**: People follow the actions of others, especially under uncertainty.

**Implementation**:
- Display **live counters** ("1,247 developers verified this month")
- Show a **rotating activity pulse** ("New verifications in the last hour")
- Place social proof **near the primary CTA** for maximum impact

```tsx
function SocialProof() {
  return (
    <div className="social-proof">
      <div className="social-proof-counter">
        <span className="counter-number">1,247</span>
        <span className="counter-label">developers verified this month</span>
      </div>
      <div className="social-proof-pulse">
        <span className="pulse-dot" />
        <span className="pulse-text">12 verifications in the last hour</span>
      </div>
    </div>
  );
}
```

```css
.pulse-dot {
  width: 8px;
  height: 8px;
  background: var(--success);
  border-radius: 50%;
  animation: pulseDot 2s ease-in-out infinite;
}

@keyframes pulseDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.5); }
}
```

---

## 10. Progressive Disclosure — Show Just Enough

**Principle**: Don't overwhelm users. Reveal complexity only when they need it.

**Implementation**:
- Empty states show a **single next step** + optional "Learn more" link
- Add `stepHint` prop for contextual guidance
- Collapse advanced options by default

```tsx
function EmptyState({ title, description, action, stepHint, secondaryAction }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>

      {/* Primary action — the ONE thing to do */}
      <button className="btn-primary" onClick={action.onClick}>
        {action.label}
      </button>

      {/* Progressive: contextual hint, only if provided */}
      {stepHint && <p className="step-hint">{stepHint}</p>}

      {/* Progressive: secondary action for curious users */}
      {secondaryAction && (
        <a href={secondaryAction.href} className="learn-more">
          {secondaryAction.label} →
        </a>
      )}
    </div>
  );
}
```

---

## Quick Reference Cheat Sheet

| Law | One-liner | Where to Apply |
|-----|-----------|----------------|
| **Fitts** | Bigger targets = faster clicks | Buttons, touch targets, mobile CTAs |
| **Von Restorff** | Different = memorable | Primary CTAs, key actions |
| **Hick** | Fewer choices = faster decisions | Selection screens, option lists |
| **Miller** | Chunk into 3–5 groups | Dashboards, settings, forms |
| **Loss Aversion** | Frame as loss, not gain | Unclaimed rewards, expiring offers |
| **Zeigarnik** | Start at 20%, not 0% | Multi-step flows, onboarding |
| **Serial Position** | First + last are remembered | Navigation, feature lists |
| **Peak–End** | End on a high note | Success screens, confirmations |
| **Social Proof** | Show others doing it | Near CTAs, onboarding, landing |
| **Progressive Disclosure** | Reveal on demand | Empty states, forms, settings |
