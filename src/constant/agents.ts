export const responseSyntaxTypes = ["markdown"] as const;

export type ResponseSyntax = typeof responseSyntaxTypes[number];

export const responseSyntaxPrompts: Record<ResponseSyntax, string> = {
    markdown: "Always respond in markdown syntax",
}

export const defaultGreetingMessage = "Hello, How can i help you?";
