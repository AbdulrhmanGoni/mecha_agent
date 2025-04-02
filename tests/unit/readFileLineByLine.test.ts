import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { readFileLineByLine } from "../../src/helpers/readFileLineByLine.ts";

export default function readFileLineByLine_test() {
    it("Should read the file line by line and fire `onLine` with each line", async () => {
        const multiLinesTextFile = `line 1\nline 2\nline 3\nline 4\nline 5\nline 6\nline 7`
        expect.assertions(multiLinesTextFile.split("\n").length * 2)

        const file = new Blob([multiLinesTextFile])

        await new Promise<void>((resolve, reject) => {
            readFileLineByLine(
                file.stream(),
                {
                    onLine(line, lineNumber) {
                        expect(lineNumber).not.toBeNaN();
                        expect(line).toMatch(/line \d/);
                    },
                }
            )
                .then(resolve)
                .catch(reject)
        })
    });
};
