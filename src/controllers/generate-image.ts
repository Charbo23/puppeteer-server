import type { Context } from "koa";
import GenerateImageService from "@/services/generate-image";

class GenerateImageController {
    private service: GenerateImageService = new GenerateImageService();

    generate = async (ctx: Context) => {
        const ret = await this.service.generate(ctx);
        let body = ret;
        if (
            ret &&
            ret.data &&
            ret.data.img &&
            Object.prototype.toString.call(ret.data.img) ===
                "[object Uint8Array]"
        ) {
            ctx.type = `image/${ret.data.type || "png"}`;
            body = ret.data.img;
        }
        ctx.body = body;
    };
}

export default new GenerateImageController();
