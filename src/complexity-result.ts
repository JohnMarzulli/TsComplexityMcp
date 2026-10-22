import { ComplexityDetail } from "./complexity-detail.js";

/**
 * Outcome of {@link getCodeComplexity}. Construct via {@link ComplexityResult.success} or
 * {@link ComplexityResult.failure}; fields that do not apply hold empty values (`0`, `[]`, `""`)
 * rather than null or undefined, so check `ok` before reading them.
 */
export class ComplexityResult {
    private constructor(
        /** True when the snippet was scored; false when it was rejected or analysis failed. */
        readonly ok: boolean,
        /** tsmetrics-core's collected complexity for the whole snippet; `0` on failure. */
        readonly total: number,
        /** Every node that adds to `total`, in source order; empty on failure. */
        readonly details: readonly ComplexityDetail[],
        /** Human-readable reason for failure; `""` on success. */
        readonly error: string,
    ) {
    }

    /**
     * Creates a successful result.
     * @param total Score for the whole snippet.
     * @param details Contributing nodes; their `complexity` values sum to `total`.
     */
    static success(
        total: number,
        details: readonly ComplexityDetail[]
    ): ComplexityResult {
        return new ComplexityResult(true, total, details, "");
    }

    /**
     * Creates a failed result.
     * @param error Reason shown to the caller; should be non-empty.
     */
    static failure(
        error: string
    ): ComplexityResult {
        return new ComplexityResult(false, 0, [], error);
    }
}
