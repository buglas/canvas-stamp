import { Matrix3 } from '../math/Matrix3'
import { Vector2 } from '../math/Vector2'

class Camera {
	position: Vector2
	zoom: number

	constructor(x = 0, y = 0, zoom = 1) {
		this.position = new Vector2(x, y)
		this.zoom = zoom
	}
	get matrixInvert() {
		const {
			position: { x, y },
			zoom,
		} = this
		return new Matrix3().makeScale(zoom, zoom).translate(x, y).invert()
	}
	/* 对物体的逆向变换，先位移后缩放 */
	transformInvert(ctx: CanvasRenderingContext2D) {
		const {
			position: { x, y },
			zoom,
		} = this
		const scale = 1 / zoom
		ctx.scale(scale, scale)
		ctx.translate(-x, -y)
	}
}
export { Camera }
