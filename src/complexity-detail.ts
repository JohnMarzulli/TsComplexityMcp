/**
 * One syntax node that adds to the complexity score, as reported by tsmetrics-core.
 *
 * Line numbers are 1-based and relative to the submitted snippet. `startLine` is where
 * the node begins (ignoring leading comments); `endLine` is where it ends, so a construct
 * such as an `if` block spans every line of its body.
 */

export interface ComplexityDetail {
    readonly startLine: number;
    readonly endLine: number;
    /** Increment this node adds on its own, excluding nested nodes (listed separately). */
    readonly complexity: number;
    /** tsmetrics-core label for the node kind, e.g. "If statement". */
    readonly description: string;
}
