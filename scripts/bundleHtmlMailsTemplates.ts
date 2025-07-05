import { minify } from "@minify-html/deno";
import { encodeBase64 } from "@std/encoding";
import juice from 'juice'


const decoder = new TextDecoder();
let file = decoder.decode(
    await Deno.readFile("html-mails-templates/oneTimePasswordMailTemplate.html")
)

const logoFile = await Deno.readFile("html-mails-templates/logo.webp")

file = juice(file).replaceAll(/{APP_URL}|MECHA_AGENT_LOGO/gi, (placeholder) => {
    switch (placeholder) {
        case "MECHA_AGENT_LOGO": return `data:image/webp;base64,${encodeBase64(logoFile)}`

        case "{APP_URL}": return Deno.env.get("CLIENT_URL") ?? placeholder

        default: return ""
    }
})

const encoder = new TextEncoder();
await Deno.writeFile(
    "src/constant/html-mails-templates/oneTimePasswordMailTemplate.min.txt",
    (minify(encoder.encode(file), { minify_css: true }))
)
