
export const mockInstructions: Instruction[] = [
    {
        id: "66b6426ee5e71a872c338770",
        datasetId: "66b63caab731d0a4ba127d70",
        prompt: "How old is Abdulrhman Goni?",
        response: "Abdulrhman Goni is 22",
        userEmail: "example1@gmail.com",
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
    },
    {
        id: "66b6426ee5e71a872c338771",
        datasetId: "66b63caab731d0a4ba127d70",
        prompt: "What is the capital of Nigeria?",
        response: "The capital of Nigeria is Abuja",
        userEmail: "example2@gmail.com",
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
    },
    {
        id: "66b6426ee5e71a872c338772",
        datasetId: "66b63caab731d0a4ba127d70",
        prompt: "What is the job title of Abdulrhman Goni?",
        response: "The job title of Abdulrhman Goni is 'Software Engineer'?",
        userEmail: "example2@gmail.com",
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
    }
]

export function getRandomMockInstruction() {
    return mockInstructions[Math.floor(mockInstructions.length * Math.random())]
}

export default mockInstructions;