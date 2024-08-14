import homeController from '@/controllers/home'
import GenerateImageController from '@/controllers/generate-image'
import type Router from 'koa-router'

type HttpMethodKeys = Extract<keyof Router,
| 'get'
| 'post'
| 'put'
| 'delete'
>

interface RouteConfig {
  path: string
  // method: string | 'get' | 'post' | 'delete' | 'put'
  method: HttpMethodKeys
  action: Router.IMiddleware<any, any>
}

const routes: Array<RouteConfig> = [
  {
    path: '/',
    method: 'get',
    action: homeController.hello
  },
  {
    path: '/image',
    method: 'get',
    action: GenerateImageController.generate
  },
]
export default routes
