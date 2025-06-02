<template>
  <div class="relative flex-1 w-full h-full">
    <div class="flex flex-col w-full h-full bg-base-200 rounded-lg">
      <!-- 3D场景容器 -->
      <div class="flex-1 w-full" ref="container"></div>
    </div>

    <!-- 提示框 -->
    <div
      ref="tooltip"
      class="absolute hidden px-3 py-2 text-sm bg-base-100 border rounded-lg shadow-lg pointer-events-none"
      style="z-index: 100"
    ></div>

    <!-- 实体详情抽屉 -->
    <EntityDetail v-if="selectedEntity" :entity="selectedEntity" @close="selectedEntity = null" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import type { Entity } from '@/stores/graphStore'
import EntityDetail from '@/components/graph/EntityDetail.vue'
import * as d3 from 'd3'

const props = defineProps<{
  entities: Entity[]
  zoom?: number
}>()

const isDarkMode = computed(() => document.documentElement.getAttribute('data-theme') === 'dark')
const bgColor = computed(() => (isDarkMode.value ? '#1D232A' : '#F8F9FA'))
const textColor = computed(() => (isDarkMode.value ? '#A6ADBA' : '#2A303C'))

const container = ref<HTMLElement>()
const tooltip = ref<HTMLElement>()

const selectedEntity = ref<Entity | null>(null)
const colorScale = d3.scaleOrdinal(d3.schemeTableau10)

// Three.js 相关变量
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let cubes: THREE.Mesh[] = []

// 首先添加一些动画相关的状态变量
const clock = new THREE.Clock() // 用于跟踪时间
let pointLight: THREE.PointLight // 用于动态光效

// 初始化3D场景
const init = () => {
  if (!container.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(bgColor.value)

  // 创建相机
  const aspect = container.value.clientWidth / container.value.clientHeight
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000)
  camera.position.set(0, 100, 100)
  camera.lookAt(0, 0, 0)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  // 添加轨道控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 10
  controls.maxDistance = 200
  controls.minPolarAngle = Math.PI / 6
  controls.maxPolarAngle = Math.PI / 2
  controls.enablePan = true
  controls.screenSpacePanning = true
  controls.enableZoom = true
  controls.zoomSpeed = 0.5

  if (props.zoom) {
    const targetZoom = 100 / props.zoom
    camera.position.setLength(targetZoom)
  }

  // 添加环境光和方向光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  // 添加点光源，用于动态效果
  pointLight = new THREE.PointLight(0xffffff, 0.8, 100)
  pointLight.position.set(0, 30, 0)
  scene.add(pointLight)

  // 绘制数据
  drawCubes()

  // 动画循环
  animate()
}

// 绘制立方体
const drawCubes = () => {
  cubes.forEach((cube) => scene.remove(cube))
  cubes = []

  const maxHeight = 20
  const maxCount = Math.max(...props.entities.map((e) => e.count))
  const areaSize = 100

  // 创建网格布局
  const gridSize = Math.ceil(Math.sqrt(props.entities.length))
  const cellSize = areaSize / gridSize
  const offset = -areaSize / 2 // 居中偏移

  props.entities.forEach((entity, index) => {
    // 计算网格位置
    const row = Math.floor(index / gridSize)
    const col = index % gridSize

    // 添加随机偏移，但保持在网格单元内
    const jitterX = (Math.random() - 0.5) * cellSize * 0.5
    const jitterZ = (Math.random() - 0.5) * cellSize * 0.5

    // 计算高度（使用对数比例）
    const width = 5
    const depth = 5
    const height = (Math.log(entity.count + 1) / Math.log(maxCount + 1)) * maxHeight

    // 创建立方体
    const geometry = new THREE.BoxGeometry(width, height, depth)
    const material = new THREE.MeshPhongMaterial({
      color: colorScale(entity.category),
      transparent: true,
      opacity: 0.8,
    })
    const cube = new THREE.Mesh(geometry, material)
    // 添加标记，用于射线检测时识别
    cube.userData = {
      ...entity,
      isColumn: true, // 添加标记表示这是柱子
      originalHeight: height,
      phaseOffset: Math.random() * Math.PI * 2, // 随机相位偏移
      frequency: 0.2 + Math.random() * 0.3, // 随机频率
    }

    // 设置位置（网格位置 + 随机偏移）
    cube.position.set(
      offset + col * cellSize + jitterX,
      height / 2,
      offset + row * cellSize + jitterZ,
    )

    // 创建始终面向相机的文本
    const text = createTextSprite(
      entity.entity.slice(0, 5) + (entity.entity.length > 5 ? '...' : ''),
    )
    // 将文本放在柱子正面偏上位置
    text.position.set(0, height / 2 + 1, 0)
    cube.add(text)

    scene.add(cube)
    cubes.push(cube)
  })
}

const createTextSprite = (text: string) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  canvas.width = 256
  canvas.height = 64

  // 设置更大的字体和居中对齐
  context.fillStyle = textColor.value
  context.font = 'bold 36px Arial' // 更大的字体
  context.textAlign = 'center' // 水平居中
  context.textBaseline = 'middle' // 垂直居中
  // 添加文本描边以提高可读性
  context.strokeStyle = isDarkMode.value ? '#000000' : '#ffffff'
  context.lineWidth = 3
  context.strokeText(text, canvas.width / 2, canvas.height / 2)
  context.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter // 改善文本清晰度
  texture.magFilter = THREE.LinearFilter
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  })
  const sprite = new THREE.Sprite(spriteMaterial)
  sprite.scale.set(8, 2, 1)

  // 禁用射线检测，使鼠标事件完全穿透
  sprite.raycast = () => {}

  return sprite
}

watch(
  () => props.zoom,
  (newScale) => {
    if (controls && camera) {
      const currentZoom = controls.target.distanceTo(camera.position)
      const targetZoom = 100 / (newScale || 1) // 假设基准距离是100
      const delta = targetZoom / currentZoom

      camera.position.multiplyScalar(delta)
      controls.update()
    }
  },
)

// 处理鼠标悬停
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

const onMouseMove = (event: MouseEvent) => {
  if (!container.value || !tooltip.value) return

  const rect = container.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(cubes)

  if (intersects.length > 0 && intersects[0].object.userData.isColumn) {
    const entity = intersects[0].object.userData
    tooltip.value.innerHTML = `
      <div class="font-bold">${entity.entity}</div>
      <div>类型: ${entity.category}</div>
      <div>访问次数: ${entity.count}</div>
      <div class="text-sm text-primary cursor-pointer mt-1">点击查看完整详情</div>
    `
    tooltip.value.style.left = `${event.clientX + 10}px`
    tooltip.value.style.top = `${event.clientY + 10}px`
    tooltip.value.classList.remove('hidden')
  } else {
    tooltip.value.classList.add('hidden')
  }
}

// 点击事件处理
const onClick = (event: MouseEvent) => {
  if (!container.value) return

  const rect = container.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const columns = cubes.filter((cube) => (cube.userData as any).isColumn)
  const intersects = raycaster.intersectObjects(columns)

  if (intersects.length > 0) {
    selectedEntity.value = intersects[0].object.userData.entity // 直接使用实体名称
  }
}

// 动画循环
const animate = () => {
  requestAnimationFrame(animate)
  controls.update()

  const time = clock.getElapsedTime()

  // 更新点光源位置
  const lightRadius = 50
  pointLight.position.x = Math.cos(time * 0.5) * lightRadius
  pointLight.position.z = Math.sin(time * 0.5) * lightRadius

  // 更新所有文本精灵的朝向
  cubes.forEach((cube) => {
    const { originalHeight, phaseOffset, frequency, category } = cube.userData

    // 计算高度波动
    const amplitude = originalHeight * 0.1 // 波动幅度为原高度的10%
    const wave = Math.sin(time * frequency + phaseOffset) * amplitude
    const newHeight = originalHeight + wave

    // 更新柱子高度
    cube.scale.y = newHeight / originalHeight
    cube.position.y = newHeight / 2

    // 更新柱子颜色
    const hue = colorScale(category)
    const color = new THREE.Color(hue)
    // 减小饱和度变化范围
    const saturation = 0.7 + Math.sin(time * 0.5 + phaseOffset) * 0.1 // 频率从 2 降至 0.5，幅度从 0.3 降至 0.1
    color.offsetHSL(0, 0, Math.sin(time * 0.25 + phaseOffset) * 0.05) // 频率从 1 降至 0.25，幅度从 0.1 降至 0.05
    ;(cube.material as THREE.MeshPhongMaterial).color = color
    ;(cube.material as THREE.MeshPhongMaterial).emissive.setHSL(
      color.getHSL({ h: 0, s: 0, l: 0 }).h,
      saturation,
      0.1 + Math.sin(time * 0.75 + phaseOffset) * 0.02, // 频率从 3 降至 0.75，幅度从 0.05 降至 0.02
    )

    const sprite = cube.children[0] as THREE.Sprite
    if (sprite) {
      // 获取相机位置
      const cameraPos = new THREE.Vector3()
      camera.getWorldPosition(cameraPos)

      // 获取精灵的世界坐标
      const spritePos = new THREE.Vector3()
      sprite.getWorldPosition(spritePos)

      // 计算相机到精灵的方向向量
      const dir = new THREE.Vector3().subVectors(cameraPos, spritePos).normalize()

      // 使用 lookAt，但保持 Y 轴垂直
      const up = new THREE.Vector3(0, 1, 0)
      const right = new THREE.Vector3().crossVectors(up, dir).normalize()
      const newUp = new THREE.Vector3().crossVectors(dir, right)

      // 构建旋转矩阵
      const rotationMatrix = new THREE.Matrix4().makeBasis(right, newUp, dir)
      sprite.quaternion.setFromRotationMatrix(rotationMatrix)

      // 抵消任何 Z 轴旋转，保持文本正向
      const euler = new THREE.Euler().setFromQuaternion(sprite.quaternion)
      euler.z = 0
      sprite.quaternion.setFromEuler(euler)
    }
  })

  renderer.render(scene, camera)
}

// 处理窗口大小变化
const onResize = () => {
  if (!container.value) return

  const width = container.value.clientWidth
  const height = container.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// 添加主题监听
const onThemeChange = () => {
  if (scene) {
    scene.background = new THREE.Color(bgColor.value)
    // 重新绘制带有新文本颜色的柱子
    drawCubes()
  }
}

onMounted(() => {
  init()
  window.addEventListener('resize', onResize)
  container.value?.addEventListener('mousemove', onMouseMove)
  container.value?.addEventListener('click', onClick)

  // 监听主题变化
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'data-theme') {
        onThemeChange()
      }
    })
  })

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  container.value?.removeEventListener('mousemove', onMouseMove)
  container.value?.removeEventListener('click', onClick)
  renderer.dispose()
  cubes.forEach((cube) => cube.geometry.dispose())
})
</script>

<style scoped>
.legend-gradient {
  width: 120px;
  height: 16px;
  background: linear-gradient(to right, #fff5eb, #fd8d3c);
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
