import { describe } from "@std/testing/bdd";
import promptTemplete_test from "./promptTemplete.test.ts";
import readFileLineByLine_test from "./readFileLineByLine.test.ts";
import chatResponseHandler_test from "./chatResponseHandler.test.ts";

describe("Unit tests", () => {
    describe("Testing `promptTemplete` helper function", () => {
        promptTemplete_test()
    })

    describe("Testing `readFileLineByLine` helper function", () => {
        readFileLineByLine_test()
    })

    describe("Testing `chatResponseHandler` helper function", () => {
        chatResponseHandler_test()
    })
})