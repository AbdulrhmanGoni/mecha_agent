const chatsResponsesMessages = {
    noDataset: "Sorry!, I don't have a dataset to answer based on.",
    dontKnow: "Sorry!, I don't have enough information to answer you properly",
    inferencesLimitReached: "You have reached your daily limit of inferences, return tomorrow or upgrade your plan.",
    chatNotFound: (id: string) => `Chat with "${id}" id is not found`,
}

export default chatsResponsesMessages