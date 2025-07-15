import { Hono } from "hono";
import { UsersController } from "../controllers/UsersController.ts";
import { GuardService } from "../services/GuardService.ts";
import { readPermission, writePermission } from "../constant/permissions.ts";
import updateUserDataInputValidator from "../validation/users/updateUserDataInputValidator.ts";

export default function usersRoutesBuilder(
    usersController: UsersController,
    guardService: GuardService
) {
    const authRoutes = new Hono();

    authRoutes.get('/',
        guardService.guardRoute({ permissions: [readPermission] }),
        usersController.getUserData.bind(usersController)
    );

    authRoutes.patch('/',
        guardService.guardRoute({ permissions: [writePermission] }),
        updateUserDataInputValidator,
        usersController.updateUserData.bind(usersController)
    );

    authRoutes.delete('/',
        guardService.guardRoute({ sudoOnly: true }),
        usersController.deleteAccount.bind(usersController)
    );

    return authRoutes;
};
