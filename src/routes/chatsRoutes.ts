import { Hono } from "hono";
import { ChatsController } from "../controllers/ChatsController.ts";
import startChatInputValidator from "../validation/chats/startChatInputValidator.ts";
import continueChatInputValidator from "../validation/chats/continueChatInputValidator.ts";
import getChatMessagesInputValidator from "../validation/chats/getChatMessagesInputValidator.ts";
import deleteChatInputValidator from "../validation/chats/deleteChatInputValidator.ts";
import { inferencePermission, readPermission, writePermission } from "../constant/permissions.ts";
import { GuardService } from "../services/GuardService.ts";
import { InferencesMiddleware } from "../middlewares/InferencesMiddleware.ts";

export default function chatsRoutesBuilder(
    chatsController: ChatsController,
    guardService: GuardService,
    inferencesMiddleware: InferencesMiddleware,
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
        inferencesMiddleware.trackInferences.bind(inferencesMiddleware),
        chatsController.startPrivateChat.bind(chatsController)
    );

    chatsRoutes.post(
        '/:chatId',
        guardService.guardRoute({ permissions: [inferencePermission] }),
        continueChatInputValidator,
        inferencesMiddleware.trackInferences.bind(inferencesMiddleware),
        chatsController.continuePrivateChat.bind(chatsController)
    );

    chatsRoutes.get(
        '/:chatId',
        guardService.guardRoute({ permissions: [inferencePermission] }),
        getChatMessagesInputValidator,
        chatsController.getPrivateChatMessages.bind(chatsController)
    );

    chatsRoutes.delete(
        '/:chatId',
        guardService.guardRoute({ permissions: [writePermission] }),
        deleteChatInputValidator,
        chatsController.deleteChat.bind(chatsController)
    );

    chatsRoutes.post(
        '/public/new',
        startChatInputValidator,
        guardService.publicAgentCheck.bind(guardService),
        inferencesMiddleware.trackInferences.bind(inferencesMiddleware),
        chatsController.startPublicChat.bind(chatsController)
    );

    chatsRoutes.post(
        '/public/:chatId',
        continueChatInputValidator,
        guardService.publicAgentCheck.bind(guardService),
        inferencesMiddleware.trackInferences.bind(inferencesMiddleware),
        chatsController.continuePublicChat.bind(chatsController)
    );

    chatsRoutes.get(
        '/public/:chatId',
        getChatMessagesInputValidator,
        guardService.publicAgentCheck.bind(guardService),
        chatsController.getPublicChatMessages.bind(chatsController)
    );
    return chatsRoutes;
};
