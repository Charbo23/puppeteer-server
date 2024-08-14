import type { Context } from "koa";

/**
 * @example

curl --location --request GET \
'http://localhost:5000/image?url=https://www.baidu.com' \
--output test-image.png

 */

export default class GenerateImageService {
    generate = async (ctx: Context): Promise<unknown> => {
        if (!ctx.query.url) {
            ctx.status = 404;
            return {
                status: "NOT-FOUND",
            };
        }

        const browser =  await global.pp.use();

        const page = await browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
        );
        await page.setViewport({
            width: 393,
            height: 852,
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
        });
        const url = ctx.query.url;
        await page.goto(ctx.query.url as string, {
            waitUntil: "networkidle2",
        });
        if (url.includes("page=timu")) {
            // 等待页面内时机
            await page.waitForFunction(() => window.readyForScreenshot === true);
        }
      const img= await page.screenshot({
            fullPage: true,
            type: "png",
        });
        await page.close()
        return img
    };
}
