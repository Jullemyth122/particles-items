import React, { useEffect } from 'react'

import gsap from 'gsap'

import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import mask1 from './img/star.png'
import mask2 from './img/1.png'
import mask3 from './img/2.png'

function Scrolling() {

    useEffect(() => {
        
        let camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 0.1, 6000 );
        camera.position.z = 1500;
        let renderer = new THREE.WebGLRenderer({ antialias:true,alpha:true });
        renderer.setSize(window.innerWidth,window.innerHeight);
        document.getElementById("container").appendChild(renderer.domElement)
        // new OrbitControls(camera,renderer.domElement)
        let scene = new THREE.Scene();
        let raycaster = new THREE.Raycaster();
        let mouse = new THREE.Vector2();
        let point = new THREE.Vector2();

        let textures = [
            new THREE.TextureLoader().load(mask2),
            new THREE.TextureLoader().load(mask3)
        ]

        let mask = new THREE.TextureLoader().load(mask1)

        let time = 0;
        let move = 0;


        let material = new THREE.ShaderMaterial({
            fragmentShader: `
                varying vec2 vCoordinates;
                varying vec3 vPos;

                uniform sampler2D t1;
                uniform sampler2D t2;
                uniform sampler2D mask;
                uniform float move;

                void main() {
                    vec4 maskTexture = texture2D(mask,gl_PointCoord);
                    vec2 myUV = vec2(vCoordinates.x/512.,vCoordinates.y/512.);
                    vec4 image = texture2D(t2,myUV);
;
                    gl_FragColor = image;


                    gl_FragColor.a *=maskTexture.r;


                }
            `,
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPos;
                varying vec2 vCoordinates;
                attribute vec3 aCoordinates;
                attribute float aSpeed;
                attribute float aOffset;

                uniform float move;
                uniform float time;

                void main () {
                    vUv = uv;
                    vec3 pos = position;
                    // NOT STABLE
                    pos.x += sin(move*aSpeed)*3.;
                    pos.y += sin(move*aSpeed)*3.;
                    
                    // Use for noninfinity scrollingWheel
                    pos.z = position.z + move*100.*aSpeed + aOffset;

                    
                    // For non stable position
                    vec4 mvPosition = modelViewMatrix * vec4( pos , 1.);

                    gl_PointSize = 4000. * (1. / - mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;

                    vCoordinates = aCoordinates.xy;


                }
            `,
            uniforms:{
                progress:{
                    type:"f",value:0
                },
                t1 : {type:"t",value:textures[0]},
                t2 : {type:"t",value:textures[1]},
                mask: {type:"t",value:mask},
                move: {type:"f",value:0},
                time: {type:"f",value:0},
            
                side:THREE.DoubleSide
            },
            transparent:true,
            depthTest:false,
            depthWrite:false,
        })

        // geometry = new THREE.PlaneBufferGeometry( 1000,1000,10,10);
        let geometry = new THREE.BufferGeometry();
        let number = 512 * 512;

        let positions = new THREE.BufferAttribute(
            new Float32Array(number*3),3
        )
        let coordinates = new THREE.BufferAttribute(
            new Float32Array(number*3),3
        )
        let speeds = new THREE.BufferAttribute(
            new Float32Array(number*3),1
        )
        let offset = new THREE.BufferAttribute(
            new Float32Array(number*100),1
        )
        function rand(a,b) {
            return a + (b-a)*Math.random()
        }

        let index = 0;
        for (let i = 0; i < 512; i++) {
            let posX = i - 256
            for (let j = 0; j < 512; j++) {
                let posY = j - 256
                positions.setXYZ(
                    index,posX*2,posY*2,0
                )
                coordinates.setXYZ(index,i,j,0)
                offset.setX(index,rand(-10,10))
                speeds.setX(index,rand(0.4,1))
                index++;
            }
        }

        geometry.setAttribute("position",positions)
        geometry.setAttribute("aCoordinates",coordinates)
        geometry.setAttribute("aOffset",offset)
        geometry.setAttribute("aSpeed",speeds)

        // material = new THREE.MeshNormalMaterial({side:THREE.DoubleSide});
        let mesh = new THREE.Points( geometry, material );
        scene.add( mesh );
        
        function mouseEffects() {
            let test = new THREE.Mesh(
                new THREE.PlaneBufferGeometry(1000,1000),
                new THREE.MeshBasicMaterial()
            )
    
            window.addEventListener("mousewheel",(e) => {
                move += e.wheelDeltaY/500;
            })
            window.addEventListener("mousemove",(event) => {
                mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
                mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    
                raycaster.setFromCamera( mouse, camera );
    
                // calculate objects intersecting the picking ray
                // const intersects = raycaster.intersectObjects( scene.children );
                const intersects = raycaster.intersectObjects( [test] );
                // console.log(intersects[0].point)
    
                point.x = intersects[0].point.x
                point.y = intersects[0].point.y
    
            },false);
    
    
            window.addEventListener("resize",() => {
                renderer.setSize(window.innerWidth,window.innerHeight)
                camera.aspect = window.innerWidth/window.innerHeight
                camera.updateProjectionMatrix()
            })
        }

        mouseEffects()

        function render() {
            time++;

            
            material.uniforms.time.value = time;
            material.uniforms.move.value = move;
    
            renderer.render( scene, camera );
    
            window.requestAnimationFrame(render)

        }
        
        render()

    },[])

    return (
        <div className='container-fluid'>
            <div id="container"></div>
        </div>
    )
}

export default Scrolling