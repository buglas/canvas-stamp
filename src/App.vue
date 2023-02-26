<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Img } from './stamp/objects/Img'
import { Editor } from './component/Editor'

/* 编辑器的DOMRef */
const editorDomRef = ref<HTMLDivElement>()

/* 效果图的DOMRef */
const effectDomRef = ref<HTMLDivElement>()

/* 图层数据类型 */
interface Layer {
	src: string
	name: string
	uuid: string
	active: boolean
}

/* 图层数据类型 */
interface Layer {
	src: string
	name: string
	uuid: string
	active: boolean
}
const patternsData = ref<string[]>([])
const layersData = ref<Layer[]>([])
const editor = new Editor()
const {
	imgControler,
	cursor,
	imgGroup: { children },
} = editor

for (let i = 1; i <= 8; i++) {
	patternsData.value.push(
		`https://yxyy-pandora.oss-cn-beijing.aliyuncs.com/stamp-images/${i}.png`
	)
}

imgControler.addEventListener('selected', ({ img }) => {
	// 更新图层选择状态
	activateLayer(children.length - 1 - children.indexOf(img))
})
imgControler.addEventListener('remove', ({ img: { uuid } }) => {
	// 删除图层
	removeLayer(uuid)
})

onMounted(() => {
	if (!editorDomRef.value || !effectDomRef.value) {
		return
	}
	editor.onMounted(editorDomRef.value, effectDomRef.value)
})

onUnmounted(() => {
	editor.onUnmounted()
})

/* 选择图层 */
function selectLayer(index: number) {
	const { value } = layersData
	/* 激活图层 */
	activateLayer(index)
	// 更新图像的控制状态
	editor.controlImgByUUID(value[index].uuid)
}

/* 开始拖拽 */
function dragstart({ dataTransfer }: DragEvent, index: number) {
	dataTransfer && dataTransfer.setData('index', index.toString())
}

/* 置入 */
function drop({ dataTransfer }: DragEvent, index: number) {
	if (!dataTransfer) {
		return
	}
	/* 激活图层 */
	const dragIndex = parseInt(dataTransfer.getData('index'))
	activateLayer(dragIndex)

	// 更新图像的控制状态
	const { value } = layersData
	editor.controlImgByUUID(value[dragIndex].uuid)
	/* 互换位置 */
	;[value[dragIndex], value[index]] = [value[index], value[dragIndex]]
	const len = value.length - 1
	editor.replaceImg(len - dragIndex, len - index)
}

/* 激活图层 */
function activateLayer(index: number) {
	const { value } = layersData
	for (let i = 0, len = value.length; i < len; i++) {
		value[i].active = i === index
	}
}

/* 删除图层 */
function removeLayer(uuid: string) {
	const { value } = layersData
	for (let i = 0, len = value.length; i < len; i++) {
		if (value[i].uuid === uuid) {
			value.splice(i, 1)
			break
		}
	}
}

/* 在图像库中点击图像时，将图像添加到图层中 */
function addPattern({ target }: MouseEvent) {
	if (target instanceof Image) {
		/* 将图片添加到编辑器中 */
		const img = editor.crtImg(target)
		editor.addImg(img)

		/* 取消图层的选择 */
		for (let layer of layersData.value) {
			if (layer.active) {
				layer.active = false
				break
			}
		}
		/* 添加图像到layersData中 */
		layersData.value.unshift({
			src: target.src,
			uuid: img.uuid,
			name: img.name,
			active: true,
		})
	}
}
</script>

<template>
	<div id="left">
		<div class="tit">图案库</div>
		<div id="patternLib">
			<div class="patternWrapper" v-for="item in patternsData">
				<img class="pattern" :src="item" alt="" @click="addPattern" />
			</div>
		</div>
	</div>
	<div id="center" ref="editorDomRef" :style="{ cursor }">
		<div class="tips">
			<b>添加图案</b>: 点选图案库中的图案; <b>选择编辑视口中的图案</b>:
			单击图案或单击相应图层; <b>中心缩放</b>: alt+缩放操作; <b>等比缩放</b>:
			shift+缩放操作; <b>等量旋转</b>: shift+旋转操作; <b>删除图案</b>: Del;
			<b>取消变换</b>: Esc 或点击空白处; <b>确认变换</b>: Enter;
			<b>改变图案排列顺序</b>: 拖拽图层; <b>缩放视口</b>: 滑动鼠标滚轮;
			<b>平移视口</b>: 按住鼠标滚轮移动鼠标。<b>兼容性</b>: PC端+鼠标。
		</div>
	</div>
	<div id="right">
		<div id="effect" ref="effectDomRef"></div>
		<ul id="layers">
			<template v-for="(item, index) in layersData" :key="item.uuid">
				<li
					class="layer"
					:class="{ layerActive: item.active }"
					:data-uuid="item.uuid"
					:index="index"
					draggable="true"
					@dragover.prevent
					@dragstart="dragstart($event, index)"
					@drop="drop($event, index)"
					@click="selectLayer(index)"
				>
					<img class="thumbnail" :src="item.src" alt="" />
					{{ item.name }}
				</li>
			</template>
		</ul>
	</div>
</template>

<style scoped>
* {
	box-sizing: border-box;
}

#left {
	display: flex;
	flex-direction: column;
	border-right: 1px solid #ddd;
}
.tit {
	font-weight: bold;
	font-size: 18px;
	padding: 15px 15px 6px 15px;
	border-bottom: 1px solid #ddd;
}

#patternLib {
	padding: 15px;
	width: 200px;
	height: 100%;
	overflow-y: scroll;
}
.patternWrapper {
	flex-wrap: wrap;
	margin: 15px 0px;
}
.pattern {
	width: 100%;
	cursor: pointer;
	transition: transform 100ms;
}
.pattern:hover {
	transform: scale(1.1);
}

#center {
	flex: 1;
	background-image: url('https://yxyy-pandora.oss-cn-beijing.aliyuncs.com/stamp-images/alpha_back.png');
	position: relative;
}
.tips {
	background-color: rgba(0, 0, 0, 0.6);
	color: #fff;
	padding: 15px;
	line-height: 28px;
	position: absolute;
	bottom: 0;
}

#right {
	display: flex;
	flex-direction: column;
	width: 350px;
	border-left: 1px solid #ddd;
}
#effect {
	background-color: antiquewhite;
	height: 350px;
}
#layers {
	flex: 1;
	padding: 0;
	margin: 0;
	overflow-y: scroll;
}
.layer {
	display: flex;
	align-items: center;
	padding: 3px;
	list-style: none;
	cursor: pointer;
	transition: all 100ms;
	border-bottom: 1px solid #ddd;
	line-height: 0;
}

.layerActive {
	background-color: #f5f5f5;
	box-shadow: inset #ccc 0 1px 2px;
}
.thumbnail {
	width: 50px;
	background-image: url('https://yxyy-pandora.oss-cn-beijing.aliyuncs.com/stamp-images/alpha_back.png');
	background-size: 8px;
	margin-right: 12px;
}

/* 滚动条样式 */
ul::-webkit-scrollbar,
div::-webkit-scrollbar {
	width: 8px;
}
ul::-webkit-scrollbar-thumb,
div::-webkit-scrollbar-thumb {
	-webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
}
ul::-webkit-scrollbar-track,
div::-webkit-scrollbar-track {
	-webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
}
</style>
