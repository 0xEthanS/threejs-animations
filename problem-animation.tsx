'use client'

import React, { 
	useRef, 
	useEffect, 
	useState, 
	useCallback 
} from 'react'

import * as THREE from 'three'




// Dynamic configuration factory
const createConfig = (props: any) => {
	
	return {
		// Animation timing - now configurable
		ANIMATION: {
			TIME_STEP: (props.animationSpeed ?? 1) * 0.0013,
			WAVE_SPEED: 5,
			MAIN_ROTATION_SPEED: (props.rotationSpeed ?? 1) * 0.3,
			MAIN_ROTATION_AMPLITUDE: (props.rotationAmplitude ?? 1) * 0.2,
			SECONDARY_ROTATION_SPEED: (props.rotationSpeed ?? 1) * 0.2,
			SECONDARY_ROTATION_AMPLITUDE: (props.rotationAmplitude ?? 1) * 0.1,
			TIME_OFFSET_1: 0.33,
			TIME_OFFSET_2: 0.66,
			GEOMETRY_UPDATE_INTERVAL: 1,
			TARGET_FPS: props.targetFPS ?? 60
		},

		// Wave source configuration - now customizable
		WAVES: {
			SOURCE_COUNT: props.waveSourceCount ?? 5,
			BASE_FREQUENCY: (props.waveFrequency ?? 1) * 2,
			FREQUENCY_VARIATION: 2,
			BASE_AMPLITUDE: (props.waveAmplitude ?? 1) * 0.3,
			AMPLITUDE_VARIATION: 0.1,
			CENTRAL_FREQUENCY: (props.waveFrequency ?? 1) * 3,
			CENTRAL_AMPLITUDE: (props.waveAmplitude ?? 1) * 0.4,
			PHASE_MULTIPLIER_OUTER: 3,
			PHASE_MULTIPLIER_CENTRAL: 4,
			RADIUS_VARIATION: 0.2,
			RADIUS_FREQUENCY: 3,
			DECAY_RATE: 0.3
		},

		// Field settings - now configurable
		FIELD: {
			RESOLUTION: props.resolution ?? 32,
			SIZE_MULTIPLIER: 4,
			SCALE_1: 1.5,
			SCALE_2: 0.8,
			SCALE_3: 0.8,
			INTERFERENCE_THRESHOLD: 0.2,
			FIELD_COUNT: props.fieldCount ?? 3
		},

		// Visual appearance - now customizable
		VISUAL: {
			BACKGROUND_COLOR: props.backgroundColor ?? 0xF0EEE6,
			LINE_COLOR: props.lineColor ?? 0x333333,
			LINE_OPACITY: props.lineOpacity ?? 0.4
		},

		// Camera settings - now configurable
		CAMERA: {
			FOV: props.cameraFOV ?? 75,
			NEAR: 0.1,
			FAR: 1000,
			ZOOM: props.zoom ?? 6
		},

		// Lighting configuration - now configurable
		LIGHTING: {
			AMBIENT_INTENSITY: 0.4,
			DIRECTIONAL_INTENSITY: 0.6,
			POINT_INTENSITY: 0.4,
			DIRECTIONAL_POSITION: [5, 5, 5],
			POINT_POSITION: [-5, 3, -5],
		},

		// Field positioning and rotation
		POSITIONING: {
			FIELD_2_POSITION: [0, 1.5, 0],
			FIELD_3_POSITION: [0, -1.5, 0],
			FIELD_2_ROTATION: [Math.PI/6, 0, Math.PI/4],
			FIELD_3_ROTATION: [-Math.PI/6, 0, -Math.PI/4]
		},

		// Renderer settings - now configurable
		RENDERER: {
			MAX_PIXEL_RATIO: props.maxPixelRatio ?? 2,
		}
	}
}




export const LinenInTheWind = (props: any) => {

	const [isVisible, setIsVisible] = useState(true)


	// Destructure props with defaults
	const {
		width = '100%',
		height = '400px',
		className = '',
		zoom = 6,
	} = props




	const containerRef:any = useRef(null)
	const [currentZoom, setCurrentZoom] = useState(zoom)




	useEffect(() => {
		const handleVisibilityChange = () => {
			setIsVisible(!document.hidden)
		}
		
		document.addEventListener('visibilitychange', handleVisibilityChange)
		
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange)
		}
	}, [])




	// Generate config from props
	const CONFIG:any = React.useMemo(
		() => createConfig(props), 
		[props]
	)




	// Enhanced refs with performance tracking
	const threeRef = useRef({
		scene: null as THREE.Scene | null,
		camera: null as THREE.PerspectiveCamera | null,
		renderer: null as THREE.WebGLRenderer | null,
		mainGroup: null as THREE.Group | null,
		animationId: null as number | null,
		time: 0,
		frameCount: 0,
		// Pre-allocated resources
		geometryPools: {
			field1: null as any | null,
			field2: null as any | null,
			field3: null as any | null,
		},
		materials: {
			lineMaterial: null as THREE.LineBasicMaterial | null
		},
		// Reusable buffers to prevent garbage collection
		buffers: {
			heightMaps: [] as number[][][],
			positionArrays: [] as Float32Array[],
			tempSources: [] as any[][]
		}
	})




	// Memory-efficient material creation (reuse single material)
	const createSharedMaterial = useCallback((): THREE.LineBasicMaterial => {
		if (!threeRef.current.materials.lineMaterial) {
			threeRef.current.materials.lineMaterial = new THREE.LineBasicMaterial({ 
				color: CONFIG.VISUAL.LINE_COLOR,
				transparent: true,
				opacity: CONFIG.VISUAL.LINE_OPACITY
			})
		}
		return threeRef.current.materials.lineMaterial
	}, [CONFIG.VISUAL.LINE_COLOR, CONFIG.VISUAL.LINE_OPACITY])




	// Pre-allocate geometry pool to avoid creation/disposal every frame
	const createGeometryPool = useCallback(
		(
			resolution: number
		): THREE.Group => {
			const linesGroup = new THREE.Group()
			const material = createSharedMaterial()
			

			// Pre-create horizontal line geometries
			for (let i = 0; i <= resolution; i++) {
				const geometry = new THREE.BufferGeometry()
				const points = new Float32Array((resolution + 1) * 3)
				geometry.setAttribute('position', new THREE.BufferAttribute(points, 3))
				const line = new THREE.Line(geometry, material)
				linesGroup.add(line)
			}
			

			// Pre-create vertical line geometries
			for (let j = 0; j <= resolution; j++) {
				const geometry = new THREE.BufferGeometry()
				const points = new Float32Array((resolution + 1) * 3)
				geometry.setAttribute('position', new THREE.BufferAttribute(points, 3))
				const line = new THREE.Line(geometry, material)
				linesGroup.add(line)
			}

			
			return linesGroup
		}, 
		[createSharedMaterial]
	)




	// Optimized wave height calculation with caching
	const calculateWaveHeight = useCallback(
		(
			sources: any[], 
			x: number, z: 
			number, time: number
		): number => {
			let height = 0
			
			// Optimized loop - avoid repeated calculations
			const waveSpeed = time * CONFIG.ANIMATION.WAVE_SPEED
			
			for (let i = 0; i < sources.length; i++) {
				const source = sources[i]
				const dx = x - source.position[0]
				const dz = z - source.position[2]
				const distanceSquared = dx * dx + dz * dz
				const distance = Math.sqrt(distanceSquared)
				
				// Use pre-calculated wave speed
				height += Math.sin(distance * source.frequency - waveSpeed + source.phase) * 
				source.amplitude * 
				Math.exp(-distance * CONFIG.WAVES.DECAY_RATE)
			}
			
			return height
		}, 
		[CONFIG.ANIMATION.WAVE_SPEED, CONFIG.WAVES.DECAY_RATE]
	)




	// Efficient height map generation with buffer reuse
	const generateHeightMap = useCallback(
		(
			sources: any[], 
			size: number, 
			resolution: number, 
			time: number,
			bufferIndex: number
		): number[][] => {
			const step = size / resolution
			
			// Reuse existing buffer or create new one
			if (!threeRef.current.buffers.heightMaps[bufferIndex]) {
				threeRef.current.buffers.heightMaps[bufferIndex] = Array(resolution + 1)
					.fill(null)
					.map(() => new Array(resolution + 1))
			}
			
			const heightMap = threeRef.current.buffers.heightMaps[bufferIndex]
			
			// Calculate interference pattern grid - optimized loop
			for (let i = 0; i <= resolution; i++) {
				const x = (i * step) - (size / 2)
				
				for (let j = 0; j <= resolution; j++) {
					const z = (j * step) - (size / 2)
					heightMap[i][j] = calculateWaveHeight(sources, x, z, time)
				}
			}
			
			return heightMap
		}, 
		[calculateWaveHeight]
	)




	// Update existing geometry instead of recreating
	const updateGeometryFromHeightMap = useCallback(
		(
			geometryGroup: THREE.Group,
			heightMap: number[][],
			size: number,
			resolution: number
		): void => {
			const step = size / resolution
			let lineIndex = 0
			
			// Update horizontal lines
			for (let i = 0; i <= resolution; i++) {
				const line = geometryGroup.children[lineIndex] as THREE.Line
				const geometry = line.geometry as THREE.BufferGeometry
				const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute
				const positions = positionAttribute.array as Float32Array
				
				const x = (i * step) - (size / 2)
				
				for (let j = 0; j <= resolution; j++) {
					const z = (j * step) - (size / 2)
					const index = j * 3
					positions[index] = x
					positions[index + 1] = heightMap[i][j]
					positions[index + 2] = z
				}
				
				positionAttribute.needsUpdate = true
				lineIndex++
			}
		
			// Update vertical lines
			for (let j = 0; j <= resolution; j++) {
				const line = geometryGroup.children[lineIndex] as THREE.Line
				const geometry = line.geometry as THREE.BufferGeometry
				const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute
				const positions = positionAttribute.array as Float32Array
				
				const z = (j * step) - (size / 2)
				
				for (let i = 0; i <= resolution; i++) {
					const x = (i * step) - (size / 2)
					const index = i * 3
					positions[index] = x
					positions[index + 1] = heightMap[i][j]
					positions[index + 2] = z
				}
				
				positionAttribute.needsUpdate = true
				lineIndex++
			}
		}, []
	)




	// Optimized Scene Setup
	const createScene = useCallback(
		(
			container: any
		) => {
			const width = container.clientWidth
			const height = container.clientHeight
			const dpr = window.devicePixelRatio || 1

			// Create scene
			const scene = new THREE.Scene()
			threeRef.current.scene = scene

			// Create camera
			const camera = new THREE.PerspectiveCamera(
				CONFIG.CAMERA.FOV, 
				width / height, 
				CONFIG.CAMERA.NEAR, 
				CONFIG.CAMERA.FAR
			)
			camera.position.set(0, 0, CONFIG.CAMERA.ZOOM)
			camera.lookAt(0, 0, 0)
			threeRef.current.camera = camera

			// Create renderer with performance optimizations
			const renderer = new THREE.WebGLRenderer({ 
				antialias: CONFIG.RENDERER.ANTIALIAS,
				powerPreference: "high-performance",
				alpha: true,
				stencil: false
			})
			renderer.setPixelRatio(Math.min(dpr, CONFIG.RENDERER.MAX_PIXEL_RATIO))
			renderer.setSize(width, height)

			container.appendChild(renderer.domElement)
			threeRef.current.renderer = renderer

			// Create main group for interference systems
			const mainGroup = new THREE.Group()
			scene.add(mainGroup)
			threeRef.current.mainGroup = mainGroup

			// Pre-allocate geometry pools
			const resolution = CONFIG.FIELD.RESOLUTION
			threeRef.current.geometryPools.field1 = createGeometryPool(resolution)
			mainGroup.add(threeRef.current.geometryPools.field1)
			
			if (CONFIG.FIELD.FIELD_COUNT > 1) {
				threeRef.current.geometryPools.field2 = createGeometryPool(resolution)
				threeRef.current.geometryPools.field2.position.set(...CONFIG.POSITIONING.FIELD_2_POSITION)
				threeRef.current.geometryPools.field2.rotation.set(...CONFIG.POSITIONING.FIELD_2_ROTATION)
				mainGroup.add(threeRef.current.geometryPools.field2)
				
				if (CONFIG.FIELD.FIELD_COUNT > 2) {
					threeRef.current.geometryPools.field3 = createGeometryPool(resolution)
					threeRef.current.geometryPools.field3.position.set(...CONFIG.POSITIONING.FIELD_3_POSITION)
					threeRef.current.geometryPools.field3.rotation.set(...CONFIG.POSITIONING.FIELD_3_ROTATION)
					mainGroup.add(threeRef.current.geometryPools.field3)
				}
			}

			return { scene, camera, renderer, mainGroup }
		}, 
		[
			CONFIG, 
			createGeometryPool
		]
	)




	// Wave Source Generation (optimized)
	const generateWaveSources = useCallback(
		(
			time: number, 
			scale: number, 
			bufferIndex: number
		): any[] => {
			// Reuse buffer if available
			if (!threeRef.current.buffers.tempSources[bufferIndex]) {
				threeRef.current.buffers.tempSources[bufferIndex] = []
			}
			
			const result = threeRef.current.buffers.tempSources[bufferIndex]
			result.length = 0 // Clear array without deallocation
			
			const count = CONFIG.WAVES.SOURCE_COUNT
			
			// Create wave sources in a circular pattern
			for (let i = 0; i < count; i++) {
				const angle = (i / count) * Math.PI * 2
				const radius = scale * (1 + Math.sin(angle * CONFIG.WAVES.RADIUS_FREQUENCY) * CONFIG.WAVES.RADIUS_VARIATION)
				
				result.push({
					position: [
						Math.cos(angle) * radius,
						0,
						Math.sin(angle) * radius
					],
					frequency: CONFIG.WAVES.BASE_FREQUENCY + Math.sin(angle * CONFIG.WAVES.FREQUENCY_VARIATION),
					amplitude: CONFIG.WAVES.BASE_AMPLITUDE + Math.cos(angle) * CONFIG.WAVES.AMPLITUDE_VARIATION,
					phase: time * CONFIG.WAVES.PHASE_MULTIPLIER_OUTER + angle
				})
			}
			
			// Add central source
			result.push({
				position: [0, 0, 0],
				frequency: CONFIG.WAVES.CENTRAL_FREQUENCY,
				amplitude: CONFIG.WAVES.CENTRAL_AMPLITUDE,
				phase: time * CONFIG.WAVES.PHASE_MULTIPLIER_CENTRAL
			})
			
			return result
		}, 
		[CONFIG.WAVES]
	)




	// Optimized field update - no more geometry creation/disposal
	const updateInterferenceFields = useCallback(
		() => {
			const { mainGroup, time, geometryPools } = threeRef.current
			if (!mainGroup || !geometryPools.field1) return

			const resolution = CONFIG.FIELD.RESOLUTION
			
			// Update field 1 (always present)
			const sources1 = generateWaveSources(time, CONFIG.FIELD.SCALE_1, 0)
			const heightMap1 = generateHeightMap(
				sources1, 
				CONFIG.FIELD.SCALE_1 * CONFIG.FIELD.SIZE_MULTIPLIER, 
				resolution, 
				time,
				0
			)
			updateGeometryFromHeightMap(geometryPools.field1, heightMap1, CONFIG.FIELD.SCALE_1 * CONFIG.FIELD.SIZE_MULTIPLIER, resolution)
			
			// Update additional fields only if enabled
			if (CONFIG.FIELD.FIELD_COUNT > 1 && geometryPools.field2) {
				const sources2 = generateWaveSources(time + CONFIG.ANIMATION.TIME_OFFSET_1, CONFIG.FIELD.SCALE_2, 1)
				const heightMap2 = generateHeightMap(
					sources2, 
					CONFIG.FIELD.SCALE_2 * CONFIG.FIELD.SIZE_MULTIPLIER, 
					resolution, 
					time + CONFIG.ANIMATION.TIME_OFFSET_1,
					1
				)
				updateGeometryFromHeightMap(geometryPools.field2, heightMap2, CONFIG.FIELD.SCALE_2 * CONFIG.FIELD.SIZE_MULTIPLIER, resolution)
				
				if (CONFIG.FIELD.FIELD_COUNT > 2 && geometryPools.field3) {
					const sources3 = generateWaveSources(time + CONFIG.ANIMATION.TIME_OFFSET_2, CONFIG.FIELD.SCALE_3, 2)
					const heightMap3 = generateHeightMap(
						sources3, 
						CONFIG.FIELD.SCALE_3 * CONFIG.FIELD.SIZE_MULTIPLIER, 
						resolution, 
						time + CONFIG.ANIMATION.TIME_OFFSET_2,
						2
					)
					updateGeometryFromHeightMap(geometryPools.field3, heightMap3, CONFIG.FIELD.SCALE_3 * CONFIG.FIELD.SIZE_MULTIPLIER, resolution)
				}
			}
			
			// Rotate main group using config values
			mainGroup.rotation.y = Math.sin(time * CONFIG.ANIMATION.MAIN_ROTATION_SPEED) * CONFIG.ANIMATION.MAIN_ROTATION_AMPLITUDE
			mainGroup.rotation.x = Math.cos(time * CONFIG.ANIMATION.SECONDARY_ROTATION_SPEED) * CONFIG.ANIMATION.SECONDARY_ROTATION_AMPLITUDE
		}, [CONFIG, generateWaveSources, generateHeightMap, updateGeometryFromHeightMap]
	)




	// Frame-rate limited animation loop
	const setupAnimation = useCallback(() => {
		const { renderer, scene, camera } = threeRef.current
		if (!renderer || !scene || !camera) return

		let lastTime = 0
		const targetInterval = 1000 / CONFIG.ANIMATION.TARGET_FPS

		const animate = (currentTime: number) => {
			threeRef.current.animationId = requestAnimationFrame(animate)

			// Pause when tab is hidden
  			if (!isVisible) return
			
			// Frame rate limiting
			if (currentTime - lastTime < targetInterval) {
				return
			}
			lastTime = currentTime
			
			threeRef.current.time += CONFIG.ANIMATION.TIME_STEP
			threeRef.current.frameCount++
			
			// Only update geometry every nth frame for performance
			if (threeRef.current.frameCount % CONFIG.ANIMATION.GEOMETRY_UPDATE_INTERVAL === 0) {
				updateInterferenceFields()
			}
			
			renderer.render(scene, camera)
		}
		
		threeRef.current.animationId = requestAnimationFrame(animate)
	}, [CONFIG.ANIMATION, updateInterferenceFields])




	// Resize Handling
	const setupResizeHandling = useCallback(() => {
		if (!containerRef.current) return

		const handleResize = () => {
			if (!containerRef.current || !threeRef.current.camera || !threeRef.current.renderer) return
			
			const width = containerRef.current.clientWidth
			const height = containerRef.current.clientHeight
			const dpr = window.devicePixelRatio || 1
			
			threeRef.current.camera.aspect = width / height
			threeRef.current.camera.updateProjectionMatrix()
			threeRef.current.renderer.setPixelRatio(Math.min(dpr, CONFIG.RENDERER.MAX_PIXEL_RATIO))
			threeRef.current.renderer.setSize(width, height)
		}
		
		window.addEventListener('resize', handleResize)
		
		return () => {
			window.removeEventListener('resize', handleResize)
		}
	}, [CONFIG.RENDERER.MAX_PIXEL_RATIO])




	// Comprehensive cleanup with memory leak prevention
	const cleanup = useCallback(() => {
		// Cancel animation
		if (threeRef.current.animationId) {
			cancelAnimationFrame(threeRef.current.animationId)
			threeRef.current.animationId = null
		}
		
		// Dispose of shared material
		if (threeRef.current.materials.lineMaterial) {
			threeRef.current.materials.lineMaterial.dispose()
			threeRef.current.materials.lineMaterial = null
		}
		
		// Dispose of geometry pools
		Object.values(threeRef.current.geometryPools).forEach(pool => {
			if (pool) {
				pool.children.forEach((line: any) => {
					if (line.geometry) line.geometry.dispose()
				})
			}
		})
		
		// Dispose of renderer
		if (threeRef.current.renderer) {
			threeRef.current.renderer.dispose()
			threeRef.current.renderer.forceContextLoss()
			if (containerRef.current && containerRef.current.contains(threeRef.current.renderer.domElement)) {
				containerRef.current.removeChild(threeRef.current.renderer.domElement)
			}
		}
		
		// Clear all buffers
		threeRef.current.buffers.heightMaps = []
		threeRef.current.buffers.positionArrays = []
		threeRef.current.buffers.tempSources = []
		
		// Clear all refs
		Object.keys(threeRef.current.geometryPools).forEach(key => {
			threeRef.current.geometryPools[key as keyof typeof threeRef.current.geometryPools] = null
		})
		
		threeRef.current.scene = null
		threeRef.current.camera = null
		threeRef.current.renderer = null
		threeRef.current.mainGroup = null
		threeRef.current.time = 0
		threeRef.current.frameCount = 0
	}, [])




	// Main useEffect - clean and organized
	useEffect(() => {
		if (!containerRef.current) return
				
		const container = containerRef.current
		
		// Initialize everything in sequence using split functions
		createScene(container)

		setupAnimation()
		
		const removeResizeListener = setupResizeHandling()
		
		// Return cleanup function
		return () => {
			if (removeResizeListener) removeResizeListener()
			cleanup()
		}
	}, [createScene, setupAnimation, setupResizeHandling, cleanup])




	// Update zoom when prop changes
	useEffect(() => {
		setCurrentZoom(zoom)
		if (threeRef.current.camera) {
			threeRef.current.camera.position.z = zoom
		}
	}, [zoom])




	return (
		<div 
			ref={containerRef}
			className={className}
			style={{ 
				width: width,
				height: height,
				minHeight: '200px',
				position: 'relative',
				overflow: 'hidden'
			}}
		/>
	)



}





































