/**
 * MethodStep Component
 *
 * Step 1: Choose verification method.
 */

import type { Method } from "../types";
import { METHODS } from "../constants";

interface MethodStepProps {
    selectedMethod: Method | null;
    onSelect: (method: Method) => void;
    onContinue: () => void;
}

export function MethodStep({ selectedMethod, onSelect, onContinue }: MethodStepProps) {
    return (
        <div>
            <h2 style={{ marginBottom: "var(--space-4)" }}>Choose Verification Method</h2>
            <div className="method-grid">
                {METHODS.map((m) => (
                    <label
                        key={m.id}
                        className={`method-option ${selectedMethod?.id === m.id ? "selected" : ""}`}
                    >
                        <input
                            type="radio"
                            name="method"
                            checked={selectedMethod?.id === m.id}
                            onChange={() => onSelect(m)}
                        />
                        <div className="method-info">
                            <h4>{m.name}</h4>
                            <p>{m.description}</p>
                        </div>
                    </label>
                ))}
            </div>
            <div style={{ marginTop: "var(--space-6)" }}>
                <button
                    type="button"
                    className="btn-primary"
                    disabled={!selectedMethod}
                    onClick={onContinue}
                    style={{ width: "100%" }}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
