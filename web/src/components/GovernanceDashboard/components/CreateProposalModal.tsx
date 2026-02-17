/**
 * CreateProposalModal Component
 *
 * Modal form for creating new proposals.
 */

"use client";

import { useState } from "react";
import type { Proposal } from "../types";

interface CreateProposalModalProps {
    onClose: () => void;
    onCreate: (p: Partial<Proposal>) => void;
}

export function CreateProposalModal({ onClose, onCreate }: CreateProposalModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tokenAmount, setTokenAmount] = useState("");
    const [targetDate, setTargetDate] = useState("");

    const handleSubmit = () => {
        if (!title || !description || !tokenAmount || !targetDate) return;
        onCreate({
            title,
            description,
            tokenAmount,
            targetDate: new Date(targetDate).getTime() / 1000,
        });
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <h2>Create Proposal</h2>

                <div className="form-group">
                    <label>Title</label>
                    <input
                        type="text"
                        placeholder="e.g. Ship v2.0 — UI Redesign"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        placeholder="Describe the milestone, deliverables, and success criteria..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <p className="form-hint">Be specific about what you&apos;ll deliver and how the community can verify it.</p>
                </div>

                <div className="form-group">
                    <label>Token Amount</label>
                    <input
                        type="text"
                        placeholder="e.g. 1000000000"
                        value={tokenAmount}
                        onChange={(e) => setTokenAmount(e.target.value)}
                    />
                    <p className="form-hint">Number of tokens to unlock upon completion. Must not exceed escrow balance.</p>
                </div>

                <div className="form-group">
                    <label>Target Completion Date</label>
                    <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                    <p className="form-hint">When do you expect to complete this milestone?</p>
                </div>

                <div className="form-actions">
                    <button className="btn-secondary" onClick={onClose} type="button">
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleSubmit}
                        disabled={!title || !description || !tokenAmount || !targetDate}
                        type="button"
                    >
                        Submit Proposal
                    </button>
                </div>
            </div>
        </div>
    );
}
