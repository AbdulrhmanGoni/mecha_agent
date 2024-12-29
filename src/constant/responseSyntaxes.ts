export const responseSyntaxes = ["text", "markdown"] as const;

export type ResponseSyntax = typeof responseSyntaxes[number];
