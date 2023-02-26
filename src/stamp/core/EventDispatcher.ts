/* 事件对象 */
export interface Event {
	type: string
	target?: any
	[attachment: string]: any
}

/* 事件监听器*/
// <E, U> 为泛型
export type EventListener<E, U> = (
	// &为交叉类型
	event: E & { type: string } & { target: U }
) => void

/* 事件调度器 */
export class EventDispatcher<E extends Event> {
	// 事件类型
	type: string = ''
	// 事件目标
	target?: any;
	// 可自定义属性
	[attachment: string]: any
	// 监听器集合
	_listeners = {}

	/* 监听事件 */
	addEventListener(type: string, listener: EventListener<E, this>) {
		const listeners = this._listeners
		if (listeners[type] === undefined) {
			listeners[type] = []
		}
		if (listeners[type].indexOf(listener) === -1) {
			listeners[type].push(listener)
		}
	}

	/* 判断某个事件是否被监听 */
	hasEventListener(type: string, listener: EventListener<E, this>) {
		const listeners = this._listeners
		return (
			listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1
		)
	}

	/* 取消事件监听 */
	removeEventListener(type: string, listener: EventListener<E, this>) {
		const listeners = this._listeners
		const listenerArray = listeners[type]
		if (listenerArray !== undefined) {
			const index = listenerArray.indexOf(listener)
			if (index !== -1) {
				listenerArray.splice(index, 1)
			}
		}
	}

	/* 触发事件 */
	dispatchEvent(event: E) {
		const listeners = this._listeners
		const listenerArray = listeners[event.type]
		if (listenerArray !== undefined) {
			event.target = this
			// 复制一份侦听器集合，以防在迭代时删除侦听器。
			const array = listenerArray.slice(0)
			for (let i = 0, l = array.length; i < l; i++) {
				array[i].call(this, event)
			}
			event.target = null
		}
	}
}
