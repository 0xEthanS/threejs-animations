'use client'

import React, { useEffect, useRef, useCallback, useState } from 'react'
import * as THREE from 'three'




// Configuration object - all magic numbers centralized
const CONFIG = {
	PARTICLE_COUNT: 5000,
	CAMERA_Z: 5,
	CAMERA_FOV: 75,
	ROTATION_SPEED: 0.08,
	PULSE_SPEED: 0.3,
	VESSEL_SCALE: 2.75,
	VESSEL_HEIGHT_OFFSET: -1.2,
	TARGET_FPS: 60,
	BACKGROUND_COLOR: '#FFF',
	PARTICLE_OPACITY: 0.4,
	RESIZE_DEBOUNCE: 100,
	MAX_PIXEL_RATIO: 2,
	
	// Particle generation constants
	PARTICLES: {
		SPIRAL_TURNS: 40,
		RADIUS_POWER: 0.5,
		RANDOMNESS: 0.05,
		ANGLE_RANDOMNESS: 0.1,
		HEIGHT_SCALE: 1.8,
		BASE_SHADE: 0.1,
		SHADE_VARIATION: 0.1,
		SHADE_RANDOMNESS: 0.02,
		BASE_SIZE: 0.1,
		SIZE_VARIATION: 0.2
	}
}




export const EmptyParticles = (
	{ 
		count = CONFIG.PARTICLE_COUNT 
	}
) => {
	const [isVisible, setIsVisible] = useState(true)
	const mountRef:any = useRef(null)
	
	// Single ref object to hold all Three.js references
	const threeRef:any = useRef({
		scene: null,
		camera: null,
		renderer: null,
		geometry: null,
		material: null,
		points: null,
		animationId: null,
		resizeObserver: null,
		clock: null
	})

	useEffect(() => {
		const handleVisibilityChange = () => {
			setIsVisible(!document.hidden)
		}
		
		document.addEventListener('visibilitychange', handleVisibilityChange)
		
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange)
		}
	}, [])
	



	// Cleanup timeouts ref
	const timeoutsRef:any = useRef([])




	// 1. Scene Creation Function
	const createScene = useCallback((container:any) => {
		const width = container.clientWidth
		const height = container.clientHeight
		
		// Create scene
		const scene = new THREE.Scene()
		//scene.background = new THREE.Color(CONFIG.BACKGROUND_COLOR)
		threeRef.current.scene = scene
		
		// Create camera
		const camera = new THREE.PerspectiveCamera(
			CONFIG.CAMERA_FOV, 
			width / height, 
			0.1, 
			1000
		)
		camera.position.z = CONFIG.CAMERA_Z
		threeRef.current.camera = camera
		
		// Create renderer
		const renderer = new THREE.WebGLRenderer({ 
			antialias: true,
			powerPreference: "high-performance",
			alpha: true,  // true enables transparency
			stencil: false,
			depth: true
		})
		renderer.setSize(width, height)
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.MAX_PIXEL_RATIO))
		container.appendChild(renderer.domElement)
		threeRef.current.renderer = renderer
		
		// Create clock
		threeRef.current.clock = new THREE.Clock()
		
		return { scene, camera, renderer }
	}, [])




	// 2. Particle System Creation Function
	const createParticleSystem = useCallback(
		() => {
			const { scene } = threeRef.current
			if (!scene) return

			// Create shader material
			const particleMaterial = new THREE.ShaderMaterial({
				uniforms: {
					time: { value: 0 },
					opacity: { value: CONFIG.PARTICLE_OPACITY }
				},
				vertexShader: `
					uniform float time;
					attribute float size;
					attribute vec3 customColor;
					varying vec3 vColor;
					
					void main() {
						vColor = customColor;
						vec3 pos = position;
						
						float radius = length(pos.xz);
						float angle = atan(pos.z, pos.x);
						float height = pos.y;
						
						float vessel = smoothstep(0.3, 0.7, radius) * 
													smoothstep(1.0, 0.7, radius);
						
						angle += time * 0.08;
						
						float space = sin(time * 0.3 + radius * 3.0) * 0.1;
						float newRadius = (radius + space) * vessel;
						
						vec3 newPos;
						newPos.x = cos(angle) * newRadius;
						newPos.z = sin(angle) * newRadius;
						newPos.y = height * vessel - 1.2;
						
						newPos *= 2.75;
						
						vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
						gl_PointSize = size * (128.0 / -mvPosition.z);
						gl_Position = projectionMatrix * mvPosition;
					}
				`,
				fragmentShader: `
					uniform float opacity;
					varying vec3 vColor;
					void main() {
						vec2 center = gl_PointCoord - vec2(0.5);
						float dist = dot(center, center);
						
						if (dist > 0.25) discard;
						
						float alpha = (1.0 - smoothstep(0.2025, 0.25, dist)) * opacity;
						gl_FragColor = vec4(vColor, alpha);
					}
				`,
				transparent: true,
				depthWrite: false,
				blending: THREE.NormalBlending,
				side: THREE.DoubleSide,
				vertexColors: true
			})
			threeRef.current.material = particleMaterial

			// Generate particle data
			const positions = new Float32Array(count * 3)
			const colors = new Float32Array(count * 3)
			const sizes = new Float32Array(count)

			let i3 = 0
			for (let i = 0; i < count; i++) {
				const t = i / count
				const radius = Math.pow(t, CONFIG.PARTICLES.RADIUS_POWER)
				const angle = t * Math.PI * CONFIG.PARTICLES.SPIRAL_TURNS
				
				const vesselHeight = Math.sin(t * Math.PI) * CONFIG.PARTICLES.HEIGHT_SCALE
				
				const randRadius = radius + (Math.random() - 0.5) * CONFIG.PARTICLES.RANDOMNESS
				const randAngle = angle + (Math.random() - 0.5) * CONFIG.PARTICLES.ANGLE_RANDOMNESS
				
				positions[i3] = Math.cos(randAngle) * randRadius
				positions[i3 + 1] = vesselHeight
				positions[i3 + 2] = Math.sin(randAngle) * randRadius

				const shade = CONFIG.PARTICLES.BASE_SHADE + 
										Math.sqrt(radius) * CONFIG.PARTICLES.SHADE_VARIATION + 
										Math.random() * CONFIG.PARTICLES.SHADE_RANDOMNESS
				colors[i3] = shade
				colors[i3 + 1] = shade
				colors[i3 + 2] = shade

				sizes[i] = (1.0 - Math.abs(vesselHeight * 0.5)) * CONFIG.PARTICLES.SIZE_VARIATION + CONFIG.PARTICLES.BASE_SIZE
				
				i3 += 3
			}

			// Create geometry
			const geometry = new THREE.BufferGeometry()
			geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
			geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3))
			geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
			geometry.computeBoundingBox()
			geometry.computeBoundingSphere()
			threeRef.current.geometry = geometry
			
			// Create points mesh
			const points = new THREE.Points(geometry, particleMaterial)
			threeRef.current.points = points
			scene.add(points)
		}, 
		[count]
	)




	// 3. Animation Setup Function
	const setupAnimation = useCallback(() => {
		const { renderer, scene, camera, material, clock } = threeRef.current
		if (!renderer || !scene || !camera || !material || !clock) return

		let lastTime = 0
		const targetInterval = 1000 / CONFIG.TARGET_FPS
		
		// Detects Visibility
		const animate = (currentTime:any) => {
			threeRef.current.animationId = requestAnimationFrame(animate)

			// Pause when tab is hidden
  			if (!isVisible) return
			
			const deltaTime = currentTime - lastTime
			if (deltaTime < targetInterval) return
			
			lastTime = currentTime - (deltaTime % targetInterval)
			
			const time = clock.getElapsedTime()
			material.uniforms.time.value = time
			
			renderer.render(scene, camera)

		}
		
		threeRef.current.animationId = requestAnimationFrame(animate)
	}, [isVisible])




	// 4. Resize Handling Setup Function
	const setupResizeHandling = useCallback(() => {
		if (!mountRef.current) return

		let resizeTimeout:any = null
		let observerTimeout:any = null

		const handleResize = () => {
			if (resizeTimeout) clearTimeout(resizeTimeout)
			
			resizeTimeout = setTimeout(() => {
				if (!mountRef.current || !threeRef.current.camera || !threeRef.current.renderer) return
				
				const container:any = mountRef.current
				const width = container.clientWidth
				const height = container.clientHeight
				
				threeRef.current.camera.aspect = width / height
				threeRef.current.camera.updateProjectionMatrix()
				threeRef.current.renderer.setSize(width, height)
			}, CONFIG.RESIZE_DEBOUNCE)
		}
		
		window.addEventListener('resize', handleResize, { passive: true })
		
		const resizeObserverCallback = () => {
			if (observerTimeout) clearTimeout(observerTimeout)
			observerTimeout = setTimeout(handleResize, CONFIG.RESIZE_DEBOUNCE)
		}
		
		const resizeObserver = new ResizeObserver(resizeObserverCallback)
		threeRef.current.resizeObserver = resizeObserver
		
		if (mountRef.current) {
			resizeObserver.observe(mountRef.current)
		}
		
		// Store cleanup functions
		timeoutsRef.current.push(() => {
			if (resizeTimeout) clearTimeout(resizeTimeout)
			if (observerTimeout) clearTimeout(observerTimeout)
			window.removeEventListener('resize', handleResize)
		})
	}, [])




	// 5. Cleanup Function
	const cleanup = useCallback(() => {



		
		// Clear timeouts
		timeoutsRef.current.forEach((clearFn:any) => clearFn())
		timeoutsRef.current = []
		



		// Cancel animation
		if (threeRef.current.animationId) {
			cancelAnimationFrame(threeRef.current.animationId)
			threeRef.current.animationId = null
		}



		
		// Disconnect resize observer
		if (threeRef.current.resizeObserver) {
			threeRef.current.resizeObserver.disconnect()
			threeRef.current.resizeObserver = null
		}



		
		// Remove points from scene
		if (threeRef.current.scene && threeRef.current.points) {
			threeRef.current.scene.remove(threeRef.current.points)
		}



		
		// Dispose of geometry and material
		if (threeRef.current.geometry) {
			threeRef.current.geometry.dispose()
			threeRef.current.geometry = null
		}



		
		if (threeRef.current.material) {
			threeRef.current.material.dispose()
			threeRef.current.material = null
		}
		



		// Dispose of renderer
		if (threeRef.current.renderer) {
			threeRef.current.renderer.dispose()
			if (mountRef.current && threeRef.current.renderer.domElement) {
				mountRef.current.removeChild(threeRef.current.renderer.domElement)
			}
			threeRef.current.renderer.forceContextLoss()
			threeRef.current.renderer = null
		}
		



		// Clear all refs
		Object.keys(threeRef.current).forEach(key => {
			threeRef.current[key] = null
		})




	}, [])




	// Main useEffect - now much cleaner and organized
	useEffect(() => {
		if (!mountRef.current) return
		
		const container = mountRef.current
		
		// Initialize everything in sequence
		createScene(container)

		createParticleSystem()

		setupAnimation()
		
		setupResizeHandling()
		
		// Return cleanup function
		return cleanup
	}, [count, createScene, createParticleSystem, setupAnimation, setupResizeHandling, cleanup])




	return (
		<div 
			ref={mountRef} 
			className='
				w-auto 
				h-[50vh] 
				rounded-2xl
			'
		/>
	)


	
}



