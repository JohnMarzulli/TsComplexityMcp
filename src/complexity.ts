import { IMetricsModel, MetricsConfiguration, MetricsParser } from "tsmetrics-core";
import ts from "typescript";
import { ComplexityDetail } from "./complexity-detail.js";
import { ComplexityResult } from "./complexity-result.js";

const TARGET_LANGUAGE_VERSION: ts.ScriptTarget = ts.ScriptTarget.Latest;

/**
 * Scores the complexity of a TypeScript snippet containing exactly one function.
 *
 * The score is based on tsmetrics-core's approximation of cyclomatic complexity using its default
 * `MetricsConfiguration`. Quirks of those defaults: the function itself counts 1, every
 * `return`, `throw`, `break` and `continue` counts 1, and `if` with or without `else`
 * counts 1. Only `&&`, `||`, `&` and `|` binary operators count; `??` does not.
 *
 * @param code Source of a single function: a function declaration, or one variable
 *   declaration initialised with an arrow function or function expression. Type
 *   annotations are allowed. Imports, classes and multiple statements are rejected.
 * @returns A successful result with the total and per-node details, or a failed result with a
 *   human-readable reason when the snippet is invalid or analysis throws.
 */
export function getCodeComplexity(
    code: string
): ComplexityResult {
    try {
        return calculateCodeComplexity(code);
    } catch (thrown: unknown) {
        return ComplexityResult.failure(`Complexity could not be calculated: ${getThrownMessage(thrown)}`);
    }
}

function calculateCodeComplexity(
    code: string
): ComplexityResult {
    const temporaryFileName: string = getUniqueFileName();
    const sourceFile: ts.SourceFile = ts.createSourceFile(temporaryFileName, code, TARGET_LANGUAGE_VERSION, true);
    const error: string = getErrorText(code, sourceFile);

    if (error !== "") {
        return ComplexityResult.failure(error);
    }

    const root: IMetricsModel = MetricsParser.getMetricsFromText(temporaryFileName, code, MetricsConfiguration, TARGET_LANGUAGE_VERSION).metrics;

    return ComplexityResult.success(root.getCollectedComplexity(), getCollectedDetails(root, sourceFile));
}

function getThrownMessage(
    thrown: unknown
): string {
    return thrown instanceof Error ? thrown.message : String(thrown);
}

// Returns "" when the snippet is a syntactically valid single function.
function getErrorText(
    code: string,
    sourceFile: ts.SourceFile
): string {
    const temporaryFileName: string = getUniqueFileName();
    const diagnostics: readonly ts.Diagnostic[] =
        ts.transpileModule(code, { fileName: temporaryFileName, reportDiagnostics: true }).diagnostics ?? [];

    if (diagnostics.length > 0) {
        return `Syntax error: ${ts.flattenDiagnosticMessageText(diagnostics[0].messageText, "\n")}`;
    }

    return isSingleFunction(sourceFile) ? "" : "Snippet must contain exactly one function and nothing else.";
}

function isSingleFunction(
    sourceFile: ts.SourceFile
): boolean {
    return sourceFile.statements.length === 1 && isFunctionStatement(sourceFile.statements[0]);
}

function isFunctionStatement(
    statement: ts.Statement
): boolean {
    return ts.isFunctionDeclaration(statement)
        || (ts.isVariableStatement(statement) && isFunctionVariableStatement(statement));
}

function isFunctionVariableStatement(
    statement: ts.VariableStatement
): boolean {
    if (statement.declarationList.declarations.length !== 1) {
        return false;
    }

    const declaration: ts.VariableDeclaration = statement.declarationList.declarations[0];
    // Falls back to the declaration itself, which fails both checks below.
    const initializer: ts.Node = declaration.initializer ?? declaration;

    return isFunctionInitializer(initializer);
}

function isFunctionInitializer(
    initializer: ts.Node
): boolean {
    return ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer);
}

function getCollectedDetails(
    model: IMetricsModel,
    sourceFile: ts.SourceFile
): ComplexityDetail[] {
    const own: ComplexityDetail[] =
        model.complexity > 0
            ? [
                {
                    startLine: model.line,
                    endLine: sourceFile.getLineAndCharacterOfPosition(model.end).line + 1,
                    complexity: model.complexity,
                    description: model.description,
                },
            ]
            : [];

    return own.concat(model.children.flatMap((child: IMetricsModel): ComplexityDetail[] => getCollectedDetails(child, sourceFile)));
}

function getUniqueFileName(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.ts`;
}