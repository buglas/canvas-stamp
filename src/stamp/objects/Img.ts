import { Matrix3 } from '../math/Matrix3'
import { Vector2 } from '../math/Vector2'
import { Object2D, Object2DType } from './Object2D'

type Attr = Object2DType & {
	image?: CanvasImageSource
	offset?: Vector2
	size?: Vector2
	view?: View | undefined
	src?: string

	shadowColor?: string | undefined
	shadowBlur?: number
	shadowOffsetX?: number
	shadowOffsetY?: number

	globalAlpha?: number | undefined
	globalCompositeOperation?: GlobalCompositeOperation | undefined
	clip?: boolean
}

type View = {
	x: number
	y: number
	width: number
	height: number
}
class Img extends Object2D {
	image: CanvasImageSource = new Image()
	offset: Vector2 = new Vector2()
	size: Vector2 = new Vector2(300, 150)
	view: View | undefined
	// 投影相关
	shadowColor: string | undefined
	shadowBlur = 0
	shadowOffsetX = 0
	shadowOffsetY = 0

	// 全局透明度
	globalAlpha: number | undefined

	//合成相关
	globalCompositeOperation: GlobalCompositeOperation | undefined

	// 裁剪
	clip = false

	// 类型
	readonly isImg = true

	constructor(attr?: Attr) {
		super()
		if (attr) {
			for (let [key, val] of Object.entries(attr)) {
				if (key === 'src' && this.image instanceof Image) {
					this.image.src = val
				} else {
					this[key] = val
				}
			}
		}
	}

	/* 世界模型矩阵*偏移矩阵 */
	get worldOffsetMatrix(): Matrix3 {
		const {
			offset: { x, y },
		} = this
		return this.worldMatrix.multiply(new Matrix3().makeTranslation(x, y))
	}

	/* 视图投影矩阵*世界模型矩阵*偏移矩阵  */
	get clipWorldOffsetMatrix(): Matrix3 {
		const {
			offset: { x, y },
		} = this
		return this.clipWorldMatrix.multiply(new Matrix3().makeTranslation(x, y))
	}

	/* 基于矩阵建立路径 */
	crtPathByMatrix(
		ctx: CanvasRenderingContext2D,
		vertices: number[],
		matrix: Matrix3
	) {
		const p0 = new Vector2(vertices[0], vertices[1]).applyMatrix3(matrix)
		ctx.moveTo(p0.x, p0.y)
		for (let i = 2, len = vertices.length; i < len; i += 2) {
			const pn = new Vector2(vertices[i], vertices[i + 1]).applyMatrix3(matrix)
			ctx.lineTo(pn.x, pn.y)
		}
		ctx.closePath()
	}

	/* 绘图 */
	drawShape(ctx: CanvasRenderingContext2D) {
		const {
			image,
			offset,
			size,
			view,
			globalAlpha,
			globalCompositeOperation,
			shadowColor,
			shadowBlur,
			shadowOffsetX,
			shadowOffsetY,
			clip,
		} = this

		/* 投影 */
		if (shadowColor) {
			ctx.shadowColor = shadowColor
			ctx.shadowBlur = shadowBlur
			ctx.shadowOffsetX = shadowOffsetX
			ctx.shadowOffsetY = shadowOffsetY
		}

		/* 全局合成 */
		globalCompositeOperation &&
			(ctx.globalCompositeOperation = globalCompositeOperation)

		/*透明度合成*/
		globalAlpha !== undefined && (ctx.globalAlpha = globalAlpha)

		/* 裁剪 */
		clip && ctx.clip()

		// 绘制图像
		if (view) {
			ctx.drawImage(
				image,
				view.x,
				view.y,
				view.width,
				view.height,
				offset.x,
				offset.y,
				size.x,
				size.y
			)
		} else {
			ctx.drawImage(image, offset.x, offset.y, size.x, size.y)
		}
	}

	/* 在裁剪坐标系或世界坐标系中，绘制图像边界 */
	crtPath(ctx: CanvasRenderingContext2D, projectionMatrix?: Matrix3) {
		const {
			size: { x: imgW, y: imgH },
			worldOffsetMatrix,
		} = this
		const matrix = projectionMatrix
			? new Matrix3().multiplyMatrices(projectionMatrix, worldOffsetMatrix)
			: worldOffsetMatrix
		const vertices = [0, 0, imgW, 0, imgW, imgH, 0, imgH]
		const p0 = new Vector2(vertices[0], vertices[1]).applyMatrix3(matrix)
		ctx.moveTo(p0.x, p0.y)
		for (let i = 2, len = vertices.length; i < len; i += 2) {
			const pn = new Vector2(vertices[i], vertices[i + 1]).applyMatrix3(matrix)
			ctx.lineTo(pn.x, pn.y)
		}
		ctx.closePath()
	}
}

export { Img }
