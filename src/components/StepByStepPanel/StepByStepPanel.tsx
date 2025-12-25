/**
 * ImageVisLab - StepByStepPanel Component
 * 
 * Educational panel that shows filter algorithms step-by-step.
 * Collapsible design - hidden by default.
 * 
 * @module StepByStepPanel
 * @author ImageVisLab Contributors
 * @license MIT
 */

import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import type { FilterType, FilterStep } from '../../types';
import { getStepByStepInfo, processFilterStep } from '../../utils/filterSteps';
import './StepByStepPanel.css';

interface StepByStepPanelProps {
    /** Currently active filter */
    activeFilter: FilterType;
    /** Original image data */
    originalImage: ImageData | null;
    /** Threshold parameter for morphology */
    threshold: number;
    /** Callback when step image changes */
    onStepImageChange: (imageData: ImageData | null) => void;
    /** Whether this mode is active */
    isActive: boolean;
    /** Toggle active state */
    onToggle: () => void;
}

export const StepByStepPanel: React.FC<StepByStepPanelProps> = ({
    activeFilter,
    originalImage,
    threshold,
    onStepImageChange,
    isActive,
    onToggle,
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [stepData, setStepData] = useState<FilterStep | null>(null);
    const formulaRef = useRef<HTMLDivElement>(null);

    const stepInfo = getStepByStepInfo(activeFilter);

    // Reset step when filter changes
    useEffect(() => {
        setCurrentStep(1);
        if (!isActive) {
            onStepImageChange(null);
        }
    }, [activeFilter, isActive, onStepImageChange]);

    // Process current step
    useEffect(() => {
        if (!isActive || !originalImage || !stepInfo.supported) {
            setStepData(null);
            return;
        }

        const step = processFilterStep(originalImage, activeFilter, currentStep, threshold);
        setStepData(step);
        onStepImageChange(step.imageData);
    }, [isActive, originalImage, activeFilter, currentStep, threshold, stepInfo.supported, onStepImageChange]);

    // Render LaTeX formula
    useEffect(() => {
        if (formulaRef.current && stepData?.formula) {
            try {
                katex.render(stepData.formula, formulaRef.current, {
                    displayMode: true,
                    throwOnError: false,
                });
            } catch {
                formulaRef.current.textContent = stepData.formula;
            }
        }
    }, [stepData?.formula]);

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleNext = () => {
        if (currentStep < stepInfo.totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleHeaderClick = () => {
        if (stepInfo.supported && originalImage) {
            onToggle();
        }
    };

    if (!stepInfo.supported) {
        return (
            <div className="step-by-step-panel disabled">
                <div className="step-header">
                    <h4>
                        <span className="expand-icon">▶</span>
                        Step-by-Step
                    </h4>
                    <span className="not-supported">N/A</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`step-by-step-panel ${isActive ? 'active' : ''}`}>
            {/* Clickable Header - Always visible */}
            <div className="step-header" onClick={handleHeaderClick}>
                <h4>
                    <span className="expand-icon">▶</span>
                    Step-by-Step
                </h4>
                <button
                    className={`toggle-btn ${isActive ? 'on' : 'off'}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                    disabled={!originalImage}
                >
                    {isActive ? 'ON' : 'OFF'}
                </button>
            </div>

            {/* Collapsible Content */}
            <div className="step-content">
                {stepData && (
                    <>
                        {/* Step Navigation */}
                        <div className="step-navigation">
                            <button
                                className="nav-btn"
                                onClick={handlePrev}
                                disabled={currentStep === 1}
                            >
                                ←
                            </button>
                            <span className="step-indicator">
                                {currentStep} / {stepInfo.totalSteps}
                            </span>
                            <button
                                className="nav-btn"
                                onClick={handleNext}
                                disabled={currentStep === stepInfo.totalSteps}
                            >
                                →
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="step-progress">
                            <div
                                className="step-progress-fill"
                                style={{ width: `${(currentStep / stepInfo.totalSteps) * 100}%` }}
                            />
                        </div>

                        {/* Step Title */}
                        <h5 className="step-title">{stepData.title}</h5>

                        {/* Formula */}
                        {stepData.formula && (
                            <div className="step-formula" ref={formulaRef} />
                        )}

                        {/* Description */}
                        <p className="step-description">{stepData.description}</p>

                        {/* Step Names */}
                        <div className="step-breadcrumb">
                            {stepInfo.stepNames.map((name, idx) => (
                                <span
                                    key={idx}
                                    className={`breadcrumb-item ${idx + 1 === currentStep ? 'current' : ''} ${idx + 1 < currentStep ? 'completed' : ''}`}
                                    onClick={() => setCurrentStep(idx + 1)}
                                >
                                    {name}
                                </span>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default StepByStepPanel;
