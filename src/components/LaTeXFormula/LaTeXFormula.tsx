/**
 * ImageVisLab - LaTeX Formula Component
 * 
 * Reusable component for rendering LaTeX formulas using KaTeX.
 * 
 * @module LaTeXFormula
 * @author ImageVisLab Contributors
 * @license MIT
 */

import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LaTeXFormulaProps {
    /** LaTeX string to render */
    formula: string;
    /** Whether to use display mode (centered, larger) */
    displayMode?: boolean;
    /** Additional CSS class names */
    className?: string;
}

/**
 * Renders a LaTeX formula using KaTeX.
 * Falls back to plain text if rendering fails.
 */
export const LaTeXFormula: React.FC<LaTeXFormulaProps> = ({
    formula,
    displayMode = false,
    className = '',
}) => {
    const containerRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            try {
                katex.render(formula, containerRef.current, {
                    displayMode,
                    throwOnError: false,
                });
            } catch {
                containerRef.current.textContent = formula;
            }
        }
    }, [formula, displayMode]);

    return <span ref={containerRef} className={`latex-inline ${className}`} />;
};

export default LaTeXFormula;
