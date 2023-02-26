import { Camera } from './Camera'
import { Group } from '../objects/Group'
import { Object2D } from '../objects/Object2D'
import { Vector2 } from '../math/Vector2'

class Scene extends Group {
	// canvas 上下文对象
	ctx: CanvasRenderingContext2D
	// 类型
	readonly isScene = true

	constructor(
		// canvas画布
		public _canvas = document.createElement('canvas'),
		// 相机
		public camera = new Camera(),
		// 是否清理画布
		public autoClear = true
	) {
		super()
		this.ctx = _canvas.getContext('2d') as CanvasRenderingContext2D
		this.camera = camera
	}
	get canvas() {
		return this._canvas
	}
	set canvas(value) {
		this._canvas = value
		this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
	}

	/*  渲染 */
	render() {
		const {
			canvas: { width, height },
			ctx,
			camera,
			children,
			autoClear,
		} = this
		ctx.save()
		// 清理画布
		autoClear && ctx.clearRect(0, 0, width, height)
		// 坐标系居中
		ctx.translate(width / 2, height / 2)
		// 渲染子对象
		for (let obj of children) {
			ctx.save()
			// 相机逆变换
			obj.enableCamera && camera.transformInvert(ctx)
			obj.draw(ctx)
			ctx.restore()
		}
		ctx.restore()
	}

	/* client坐标转canvas坐标 */
	clientToCanvas(clientX: number, clientY: number) {
		const { canvas } = this
		const { left, top } = canvas.getBoundingClientRect()
		return new Vector2(clientX - left, clientY - top)
	}

	/* canvas坐标转裁剪坐标 */
	canvastoClip(canvasPos: Vector2) {
		const {
			canvas: { width, height },
		} = this
		// 坐标系居中
		return new Vector2().subVectors(
			canvasPos,
			new Vector2(width / 2, height / 2)
		)
	}

	/* client坐标转裁剪坐标 */
	clientToClip(clientX: number, clientY: number) {
		return this.canvastoClip(this.clientToCanvas(clientX, clientY))
	}

	/* 基于裁剪坐标系，判断点位是否在图形内 */
	isPointInObj(obj: Object2D, mp: Vector2) {
		const { ctx, camera } = this
		ctx.beginPath()
		obj.crtPath(ctx, camera.matrixInvert)
		return ctx.isPointInPath(mp.x, mp.y)
	}
}
export { Scene }
