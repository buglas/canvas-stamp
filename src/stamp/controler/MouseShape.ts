import { Vector2 } from '../math/Vector2'

type Attr = {
	fillStyle?: string
	strokeStyle?: string
	mousePos?: Vector2
	center?: Vector2
	vertives?: number[]
	moveVertices?: number[]
	rotateVertices?: number[]
	scaleVertices?: number[]
}

class MouseShape {
	fillStyle = '#000'
	strokeStyle = '#fff'
	mousePos = new Vector2()
	center = new Vector2()
	vertives: number[] = []
	// 移动图标的顶点集合
	moveVertices: number[] = [0, 0, 14, 14, 6, 14, 0, 20]
	// 旋转图标的顶点集合，由[-15, 0, -9, -5, -9, -1, -5, -1, -1, 1, 1, 5, 1, 9, 5, 9, 0, 15, -5, 9, -1,9, -1, 5, -2.2, 2.2, -5, 1, -9, 1, -9, 5]旋转45°得来
	rotateVertices: number[] = [
		-10.61, -10.61, -2.83, -9.9, -5.66, -7.07, -2.83, -4.24, -1.41, 0, -2.83,
		4.24, -5.66, 7.07, -2.83, 9.9, -10.61, 10.61, -9.9, 2.83, -7.07, 5.66,
		-4.24, 2.83, -3.11, 0, -4.24, -2.83, -7.07, -5.66, -9.9, -2.83,
	]
	// 缩放图标的顶点集合
	scaleVertices: number[] = [
		1, 4, 1, 1, 5, 1, 5, 5, 11, 0, 5, -5, 5, -1, 1, -1, 1, -4, -1, -4, -1, -1,
		-5, -1, -5, -5, -11, 0, -5, 5, -5, 1, -1, 1, -1, 4,
	]
	constructor(attr: Attr = {}) {
		Object.assign(this, attr)
	}

	scale(ctx: CanvasRenderingContext2D) {
		const { mousePos, center } = this
		this.drawScale(ctx, new Vector2().subVectors(center, mousePos).angle())
	}
	scaleY(ctx: CanvasRenderingContext2D) {
		const { center, vertives } = this

		this.drawScale(
			ctx,
			new Vector2()
				.subVectors(center, new Vector2(vertives[2], vertives[3]))
				.angle()
		)
	}
	scaleX(ctx: CanvasRenderingContext2D) {
		const { center, vertives } = this
		this.drawScale(
			ctx,
			new Vector2()
				.subVectors(center, new Vector2(vertives[14], vertives[15]))
				.angle()
		)
	}
	drawScale(ctx: CanvasRenderingContext2D, ang: number) {
		ctx.rotate(ang)
		ctx.beginPath()
		this.crtPath(ctx, this.scaleVertices)
	}
	move(ctx: CanvasRenderingContext2D) {
		ctx.beginPath()
		this.crtPath(ctx, this.moveVertices)
	}
	rotate(ctx: CanvasRenderingContext2D) {
		const { mousePos, center } = this
		ctx.rotate(new Vector2().subVectors(mousePos, center).angle())
		ctx.beginPath()
		this.crtPath(ctx, this.rotateVertices)
	}

	crtPath(ctx: CanvasRenderingContext2D, vertices: number[]) {
		const p0 = new Vector2(vertices[0], vertices[1])
		ctx.moveTo(p0.x, p0.y)
		for (let i = 2, len = vertices.length; i < len; i += 2) {
			const pn = new Vector2(vertices[i], vertices[i + 1])
			ctx.lineTo(pn.x, pn.y)
		}
	}

	draw(ctx: CanvasRenderingContext2D, state: string) {
		const { mousePos, fillStyle, strokeStyle } = this
		ctx.save()
		ctx.fillStyle = fillStyle
		ctx.strokeStyle = strokeStyle
		ctx.lineWidth = 2
		ctx.translate(mousePos.x, mousePos.y)
		this[state](ctx)
		ctx.closePath()
		ctx.stroke()
		ctx.fill()
		ctx.restore()
	}
}
export { MouseShape }
