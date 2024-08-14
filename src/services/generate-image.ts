import type { Context } from "koa";
import { nanoid } from "nanoid";
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

        const browser = await global.pp.use();

        const page = await browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Puppeteer"
        );
        await page.setViewport({
            width: 375,
            height: 812,
            deviceScaleFactor: 3,
            isMobile: true,
            // hasTouch: true,
        });
        const url = ctx.query.url;
        const rquestId = nanoid(8);
        console.time("页面加载时间" + rquestId);
        await page.goto(ctx.query.url as string, {
            waitUntil: "networkidle2",
            // waitUntil:'domcontentloaded'
        });
        console.timeEnd("页面加载时间" + rquestId);
        let pageLoadState = "success";
        if (url.includes("page=timu") || url.includes("question_share")) {
            // 特定页面需等待页面内时机
            try {
                await page.waitForFunction(
                    () => window.pageLoadState !== undefined,
                    { timeout: 7000 }
                );
                pageLoadState = await page.evaluate(() => window.pageLoadState);
            } catch (e) {
                pageLoadState = "error";
            }
        }
        if (pageLoadState == "success") {
            // 页面加载成功
            const bodyHandle = await page.$("body"); //只截取body
            const img = await bodyHandle.screenshot({
                // fullPage: true,
                type: "png",
            });
            await page.close();
            return img;
        } else {
            // 页面加载失败
            await page.close();
            return {
                code: 4002,
                msg: "页面加载失败",
            };
        }
    };
}
