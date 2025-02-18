import { Hono } from "hono";
import { ChatsController } from "../controllers/ChatsController.ts";
import startChatInputValidator from "../validation/chats/startChatInputValidator.ts";
import continueChatInputValidator from "../validation/chats/continueChatInputValidator.ts";
import getChatMessagesInputValidator from "../validation/chats/getChatMessagesInputValidator.ts";
import deleteChatInputValidator from "../validation/chats/deleteChatInputValidator.ts";
import { inferencePermission, readPermission, writePermission } from "../constant/permissions.ts";
import { GuardService } from "../services/GuardService.ts";

export default function chatsRoutesBuilder(
    chatsController: ChatsController,
    guardService: GuardService,
) {
    const chatsRoutes = new Hono();

    chatsRoutes.get('/',
        guardService.guardRoute({ permissions: [readPermission] }),
        chatsController.getChats.bind(chatsController)
    );

    chatsRoutes.post(
        '/new',
        guardService.guardRoute({ permissions: [inferencePermission] }),
        startChatInputValidator,
        chatsController.startChat.bind(chatsController)
    );

    chatsRoutes.post(
        '/:chatId',
        guardService.guardRoute({ permissions: [inferencePermission] }),
        continueChatInputValidator,
        chatsController.continueChat.bind(chatsController)
    );

    chatsRoutes.get(
        '/:chatId',
        guardService.guardRoute({ permissions: [inferencePermission] }),
        getChatMessagesInputValidator,
        chatsController.getChatMessages.bind(chatsController)
    );

    chatsRoutes.delete(
        '/:chatId',
        guardService.guardRoute({ permissions: [writePermission] }),
        deleteChatInputValidator,
        chatsController.deleteChat.bind(chatsController)
    );

    return chatsRoutes;
};
