import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import Cors from "@koa/cors";
import { PORT } from "@/config";
import routes from "@/routes";
import { getLocalAddress } from "@/utils";
import puppeteer from "puppeteer";
import genericPool from "generic-pool";

// puppeteer连接池
const initPuppeteerPool = () => {
    if (global.pp) global.pp.drain().then(() => global.pp.clear());
    const opt = {
        max: 4, //最多产生多少个 puppeteer 实例 。
        min: 1, //保证池中最少有多少个实例存活
        testOnBorrow: true, // 在将 实例 提供给用户之前，池应该验证这些实例。
        autostart: false, //是不是需要在 池 初始化时 初始化 实例
        idleTimeoutMillis: 1000 * 60, //如果一个实例 60分钟 都没访问就关掉他
        evictionRunIntervalMillis: 1000 * 3, //每 3分钟 检查一次 实例的访问状态
        maxUses: 2048, //自定义的属性：每一个 实例 最大可重用次数。
        validator: (instance) => {
            if (!instance.isConnected()) {
                console.log("实例已不活跃");
            }
            return Promise.resolve(instance.isConnected());
        },
    };
    const factory = {
        create: () =>
            puppeteer
                .launch({
                    headless: true,
                    slowMo: 0,
                    args: [
                        "--no-zygote",
                        "--no-sandbox",
                        "--disable-gpu",
                        "--no-first-run",
                        "--single-process",
                        "--disable-extensions",
                        "--disable-xss-auditor",
                        "--disable-dev-shm-usage",
                        "--disable-popup-blocking",
                        "--disable-setuid-sandbox",
                        "--disable-accelerated-2d-canvas",
                        "--enable-features=NetworkService",
                        "--font-render-hinting=none",
                    ],
                })
                .then((instance) => {
                    instance.useCount = 0;
                    return instance;
                }),
        destroy: (instance) => {
            instance.close();
        },
        validate: (instance) => {
            return opt
                .validator(instance)
                .then((valid) =>
                    Promise.resolve(
                        valid &&
                            (opt.maxUses <= 0 ||
                                instance.useCount < opt.maxUses)
                    )
                );
        },
    };
    const pool = genericPool.createPool(factory, opt);
    const genericAcquire = pool.acquire.bind(pool);
    // 重写了原有池的消费实例的方法。添加一个实例使用次数的增加
    pool.acquire = () =>
        genericAcquire().then((instance) => {
            instance.useCount += 1;
            return instance;
        });

    pool.use = (fn) => {
        let resource;
        return pool
            .acquire()
            .then((r) => {
                resource = r;
                return resource;
            })
            .then(fn)
            .then(
                (result) => {
                    // 不管业务方使用实例成功与后都表示一下实例消费完成
                    pool.release(resource);
                    return result;
                },
                (err) => {
                    pool.release(resource);
                    throw err;
                }
            );
    };
    return pool;
};
global.pp = initPuppeteerPool();

const app = new Koa();
const router = new Router();

// routes
routes.forEach((route) => {
    const method = router[route.method];
    method.call(router, route.path, route.action);
});

app.use(Cors());
app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(PORT, () => {
    console.clear();

    const address = getLocalAddress();
    const localhost = address[Object.keys(address)[0]]?.[0];

    const blank1 = "".padStart(1);
    const blank2 = "".padStart(2);

    console.log(
        "\n",
        blank1,
        "🚀🚀🚀",
        "\x1b[32m",
        "Puppeteer Server running at:\n",
        "\x1b[0m"
    );
    console.log(
        blank2,
        "> Local:  ",
        "\x1b[36m",
        `http://localhost:${PORT}/`,
        "\x1b[0m"
    );
    console.log(
        blank2,
        "> Network:",
        "\x1b[36m",
        `http://${localhost}:${PORT}/\n`,
        "\x1b[0m"
    );
});
