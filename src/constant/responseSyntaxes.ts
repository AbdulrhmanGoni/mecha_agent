export const responseSyntaxes = ["markdown"] as const;

export type ResponseSyntax = typeof responseSyntaxes[number];

export const responseSyntaxesPrompt: Record<ResponseSyntax, string> = {
    markdown: "Always respond in markdown syntax, ",
}
