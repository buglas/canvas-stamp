import { ref } from 'vue'
import { ImgControler } from '../stamp/controler/ImgControler'
import { OrbitControler } from '../stamp/controler/OrbitControler'
import { Scene } from '../stamp/core/Scene'
import { Group } from '../stamp/objects/Group'
import { Img } from '../stamp/objects/Img'

class Editor {
	scene = new Scene()
	imgControler = new ImgControler()
	orbitControler = new OrbitControler(this.scene.camera)
	imgGroup = new Group()
	cursor = ref('default')
	designSize = 300
	designImg = new Img({
		src: 'https://yxyy-pandora.oss-cn-beijing.aliyuncs.com/stamp-images/design.png',
		index: 1000,
	})
	resultScene = new Scene()
	resultImgGroup = new Group()
	effectScene = new Scene()
	effectImgs: Img[] = [
		new Img({
			image: this.resultScene.canvas,
			index: 0,
		}),
		new Img({
			src: 'https://yxyy-pandora.oss-cn-beijing.aliyuncs.com/stamp-images/shirt-mask.png',
			globalCompositeOperation: 'destination-in',
			index: 1,
		}),
		new Img({
			src: 'https://yxyy-pandora.oss-cn-beijing.aliyuncs.com/stamp-images/shirt-shadow.png',
			globalCompositeOperation: 'multiply',
			index: 2,
		}),
		new Img({
			image: this.resultScene.canvas,
			globalCompositeOperation: 'destination-in',
			index: 3,
		}),
		new Img({
			src: 'https://yxyy-pandora.oss-cn-beijing.aliyuncs.com/stamp-images/shirt-origin.jpg',
			globalCompositeOperation: 'destination-over',
			index: 4,
		}),
		new Img({
			src: 'https://yxyy-pandora.oss-cn-beijing.aliyuncs.com/stamp-images/shirt-noPattern.png',
			globalCompositeOperation: 'source-over',
			index: 5,
		}),
	]

	constructor() {
		const {
			scene,
			orbitControler,
			imgGroup,
			imgControler,
			designImg,
			effectScene,
			resultScene,
			resultImgGroup,
			effectImgs,
		} = this
		scene.add(imgGroup, imgControler, designImg)
		resultScene.add(resultImgGroup)
		effectScene.add(...effectImgs)

		imgGroup.addEventListener('add', ({ obj }) => {
			if (obj instanceof Img) {
				const { image, position, rotate, scale, offset, size, uuid } = obj
				resultImgGroup.add(
					new Img({
						image,
						position,
						rotate,
						scale,
						offset,
						size,
						uuid,
					})
				)
			}
		})
		imgGroup.addEventListener('remove', ({ obj }) => {
			resultImgGroup.getObjectByProperty('uuid', obj.uuid)?.remove()
		})
		imgControler.addEventListener('transformed', ({ img }) => {
			const { position, rotate, scale, offset } = img
			Object.assign(resultImgGroup.children[imgGroup.children.indexOf(img)], {
				position,
				rotate,
				scale,
				offset,
			})
		})
		imgControler.addEventListener('remove', () => {
			this.render()
		})
		imgControler.addEventListener('change', () => {
			this.render()
		})
		orbitControler.addEventListener('change', () => {
			this.render()
		})
	}

	onMounted(editorDom: HTMLDivElement, effectDom: HTMLDivElement) {
		const {
			scene: { canvas },
			effectScene: { canvas: effectCanvas },
			resultScene: { canvas: resultCanvas },
			resultImgGroup,
			designImg,
			effectImgs,
		} = this

		/* 设计图 */
		editorDom.append(canvas)
		const { clientWidth: dx, clientHeight: dy } = editorDom
		canvas.width = dx
		canvas.height = dy
		const designSize = Math.min(dx, dy) * 0.5
		this.designSize = designSize
		designImg.size.set(designSize)
		designImg.offset.set(-designSize / 2)
		this.loadImage(designImg.image).then(() => {
			this.scene.render()
		})
		/* 设计图事件监听 */
		canvas.addEventListener('pointerdown', this.pointerdown.bind(this))
		canvas.addEventListener('pointermove', this.pointermove.bind(this))
		window.addEventListener('pointerup', this.pointerup.bind(this))
		window.addEventListener('keydown', this.keydown.bind(this))
		window.addEventListener('keyup', this.keyup.bind(this))
		canvas.addEventListener('wheel', this.wheel.bind(this))
		canvas.addEventListener('contextmenu', this.contextmenu.bind(this))

		const { clientWidth: fx, clientHeight: fy } = effectDom

		/* 图案合成图 */
		resultCanvas.width = fx
		resultCanvas.height = fy
		resultImgGroup.scale.set(fx / this.designSize)
		resultImgGroup.position.set(0, fx * 0.12)

		/* 效果图 */
		effectDom.append(effectCanvas)
		effectCanvas.width = fx
		effectCanvas.height = fy
		effectImgs.forEach((ele) => {
			ele.size.set(fx)
			ele.offset.set(-fx / 2)
		})
		const pros = effectImgs
			.filter((ele) => ele.image instanceof Image)
			.map((ele) => {
				return this.loadImage(ele.image)
			})
		Promise.all(pros).then(() => {
			this.effectScene.render()
		})
	}

	loadImage(image: CanvasImageSource) {
		return new Promise((resolve) => {
			if (image instanceof Image) {
				image.onload = function () {
					resolve(image)
				}
			}
		})
	}

	onUnmounted() {
		const {
			scene: { canvas },
			effectScene: { canvas: effectCanvas },
		} = this

		/* 删除canvas，避免onMounted时重复添加 */
		canvas.remove()
		effectCanvas.remove()

		/* 取消事件监听 */
		canvas.removeEventListener('pointerdown', this.pointerdown)
		canvas.removeEventListener('pointermove', this.pointermove)
		window.removeEventListener('pointerup', this.pointerup)
		window.removeEventListener('keydown', this.keydown)
		window.removeEventListener('keyup', this.keyup)
		canvas.removeEventListener('wheel', this.wheel)
		canvas.removeEventListener('contextmenu', this.contextmenu)
	}

	pointerdown(event: PointerEvent) {
		event.preventDefault()
		const { scene, imgControler, imgGroup, cursor, orbitControler } = this
		const { button, clientX, clientY } = event
		const mlp = scene.clientToClip(clientX, clientY)
		switch (button) {
			case 0:
				imgControler.pointerdown(imgGroup.children, mlp)
				this.updateMouseCursor('pointerdown')
				break
			case 1:
				orbitControler.pointerdown(clientX, clientY)
				break
		}
	}

	pointermove(event: PointerEvent) {
		event.preventDefault()
		const { scene, imgControler, cursor, orbitControler } = this
		const { clientX, clientY } = event
		const mlp = scene.clientToClip(clientX, clientY)
		imgControler.pointermove(mlp)
		this.updateMouseCursor('pointermove')
		orbitControler.pointermove(clientX, clientY)
	}

	pointerup({ button }: PointerEvent) {
		switch (button) {
			case 0:
				this.imgControler.pointerup()
				break
			case 1:
				this.orbitControler.pointerup()
				break
		}
	}

	keydown({ key, altKey, shiftKey }: KeyboardEvent) {
		this.imgControler.keydown(key, altKey, shiftKey)
		if (key === 'Enter' || key === 'Escape') {
			this.updateMouseCursor()
		}
	}
	keyup({ altKey, shiftKey }: KeyboardEvent) {
		this.imgControler.keyup(altKey, shiftKey)
	}
	wheel({ deltaY }: WheelEvent) {
		this.orbitControler.doScale(deltaY)
	}
	contextmenu(event: MouseEvent) {
		event.preventDefault()
	}

	updateMouseCursor(pointerType?: 'pointerdown' | 'pointermove') {
		const {
			cursor,
			imgControler: { mouseState, controlState },
		} = this
		switch (pointerType) {
			case 'pointerdown':
				cursor.value = mouseState ? 'none' : 'default'
				break
			case 'pointermove':
				cursor.value = mouseState || controlState ? 'none' : 'default'
				break
			default:
				cursor.value = 'default'
		}
	}

	/* 建立图像对象 */
	crtImg(image: HTMLImageElement) {
		const {
			imgGroup: { children },
		} = this
		const layerNum =
			(children.length ? Math.max(...children.map((obj) => obj.layerNum)) : 0) +
			1
		const imgObj = new Img({
			image,
			layerNum,
			name: '图层' + layerNum,
		})
		this.setImgSize(imgObj, 0.5)
		return imgObj
	}

	/* 设置图像尺寸 */
	setImgSize(imgObj: Img, ratio = 1) {
		const { designSize } = this
		const { width, height } = imgObj.image as HTMLImageElement
		const w = designSize * ratio
		const h = (w * width) / height
		imgObj.size.set(w, h)
		imgObj.offset.set(-w / 2, -h / 2)
	}

	/* 将新的图片添加到imgGroup中，并控制此图 */
	addImg(img: Img) {
		this.imgGroup.add(img)
		this.imgControler.img = img
	}

	/* 互换图像位置 */
	replaceImg(a: number, b: number) {
		const { imgGroup, resultImgGroup } = this
		for (let group of [imgGroup, resultImgGroup]) {
			const { children } = group
			;[children[a], children[b]] = [children[b], children[a]]
		}
		this.render()
	}

	/* 基于uuid 控制图像 */
	controlImgByUUID(uuid: string) {
		const { imgGroup, imgControler } = this
		const obj = imgGroup.getObjectByProperty('uuid', uuid)
		if (obj instanceof Img && uuid === uuid) {
			imgControler.img = obj
		}
	}

	/* 设计图和效果图的渲染 */
	render() {
		this.scene.render()
		this.resultScene.render()
		this.effectScene.render()
	}
}

export { Editor }
