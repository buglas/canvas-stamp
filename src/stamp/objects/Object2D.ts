import { Vector2 } from '../math/Vector2'
import { Group } from './Group'
import { Scene } from '../core/Scene'
import { EventDispatcher, Event } from '../core/EventDispatcher'
import { Matrix3 } from '../math/Matrix3'
import { generateUUID } from '../math/MathUtils.js'

/* 
所有图形对象的基类
负责矩阵变换和图形可见性
*/
export type Object2DType = {
	position?: Vector2
	rotate?: number
	scale?: Vector2
	visible?: boolean
	index?: number
	name?: string
	parent?: Scene | Group | undefined
	enableCamera?: boolean
	[key: string]: any
}
class Object2D extends EventDispatcher<Event> {
	// 位置
	position = new Vector2()
	// 旋转
	rotate = 0
	// 缩放
	scale = new Vector2(1, 1)
	// 可见性
	visible = true
	// 渲染顺序
	index = 0
	// 名称
	name = ''
	// 父级
	parent: Group | undefined
	// 是否受相机影响-只适用于Scene的children元素
	enableCamera = true
	// UUID
	uuid = generateUUID()

	// 类型
	readonly isObject2D = true

	/* 先变换(缩放+旋转)后位移 */
	transform(ctx: CanvasRenderingContext2D) {
		const { position, rotate, scale } = this
		ctx.translate(position.x, position.y)
		ctx.rotate(rotate)
		ctx.scale(scale.x, scale.y)
	}

	/* 本地模型矩阵 */
	get matrix(): Matrix3 {
		const { position, rotate, scale } = this
		return new Matrix3()
			.scale(scale.x, scale.y)
			.rotate(rotate)
			.translate(position.x, position.y)
	}

	/* 世界模型矩阵 */
	get worldMatrix(): Matrix3 {
		const { parent, matrix } = this
		if (parent) {
			return parent.worldMatrix.multiply(matrix)
		} else {
			return matrix
		}
	}

	/* 世界裁剪矩阵 */
	get clipWorldMatrix(): Matrix3 {
		const m = new Matrix3()
		const scene = this.getScene()
		if (scene) {
			const { camera } = scene
			return m.multiplyMatrices(camera.matrixInvert, this.worldMatrix)
		}
		return m
	}

	/* 总缩放量 */
	get worldScale(): Vector2 {
		const { scale, parent } = this
		if (parent) {
			return scale.clone().multiply(parent.worldScale)
		} else {
			return scale
		}
	}

	/* 从父级中删除自身 */
	remove() {
		const { parent } = this
		parent && parent.remove(this)
	}

	/* 绘图 */
	draw(ctx: CanvasRenderingContext2D) {
		if (!this.visible) {
			return
		}
		ctx.save()
		/*  矩阵变换 */
		this.transform(ctx)
		/* 绘制图形 */
		this.drawShape(ctx)
		ctx.restore()
	}

	/* 尝试获取场景 */
	getScene(): Scene | null {
		if ('isScene' in this) {
			return this as unknown as Scene
		} else if (this.parent) {
			return this.parent.getScene()
		} else {
			return null
		}
	}

	/* 绘制图形-接口 */
	drawShape(ctx: CanvasRenderingContext2D) {}

	/* 创建路径-接口 */
	crtPath(ctx: CanvasRenderingContext2D, projectionMatrix: Matrix3) {}
}

export { Object2D }
