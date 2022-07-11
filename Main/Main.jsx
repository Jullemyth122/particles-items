import React, { useEffect } from 'react'

import gsap from 'gsap'

import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import mask1 from './img/star.png'
import mask2 from './img/1.png'
import mask3 from './img/2.png'
import mask4 from './img/3.png'
import mask5 from './img/4.png'
import mask6 from './img/5.png'
import mask7 from './img/6.png'
import mask8 from './img/7.png'

function Main() {

    useEffect(() => {


        let camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 6000 );
        camera.position.z = 1300;
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
            new THREE.TextureLoader().load(mask3),
            new THREE.TextureLoader().load(mask4),
            new THREE.TextureLoader().load(mask5),
            new THREE.TextureLoader().load(mask6),
            new THREE.TextureLoader().load(mask7),
            new THREE.TextureLoader().load(mask8),
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
                    // vec4 image = texture2D(t1,myUV);
                    vec4 tt1 = texture2D(t1,myUV);
                    vec4 tt2 = texture2D(t2,myUV);

                    // vec4 final = mix(tt1,tt2,fract(move));
                    vec4 final = mix(tt1,tt2,smoothstep(0.,1.,fract(move)));

                    float alpha = 1. - clamp(0.,1.,abs(vPos.z/900.));
                    // gl_FragColor = vec4(vCoordinates.x/512.,1.,0.,1.);
                    // gl_FragColor = image;
                    gl_FragColor = final;
                    // gl_FragColor = maskTexture;

                    gl_FragColor.a *=maskTexture.r*alpha;
                    // gl_FragColor = vec4(alpha);


                }
            `,
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPos;
                varying vec2 vCoordinates;
                attribute vec3 aCoordinates;
                attribute float aSpeed;
                attribute float aOffset;
                attribute float aDirection;
                attribute float aPress;
                
                // uniform sampler2D t1;
                // uniform sampler2D t2;
                uniform float move;
                uniform float time;
                uniform vec2 mouse;
                uniform float mousePressed;
                uniform float transition;

                void main () {
                    vUv = uv;
                    vec3 pos = position;
                    // NOT STABLE
                    pos.x += sin(move*aSpeed)*10.;
                    pos.y += sin(move*aSpeed)*10.;
                    
                    // Use for noninfinity scrollingWheel
                    // pos.z = position.z + move*20.*aSpeed + aOffset;

                    // Use mod for infinity scrollingWHeel.
                    // pos.z = mod(position.z + move*20.*aSpeed + aOffset,2000.) - 1000.;
                    pos.z = mod(position.z + move*200.*aSpeed + aOffset,2000.) - 1000.;


                    //STABLE
                    vec3 stable = position;
                    float dist = distance(stable.xy,mouse);
                    float area = 1. - smoothstep(0.,200.,dist);

                    stable.x += 50.*sin(0.1 * time * aPress)*aDirection*area*mousePressed;
                    stable.y += 50.*sin(0.1 * time * aPress)*aDirection*area*mousePressed;
                    stable.z += 200.*cos(0.1 * time * aPress)*aDirection*area*mousePressed;

                    pos = mix(pos,stable,transition);

                    // vec4 mvPosition = modelViewMatrix * vec4( position , 1.);
                    
                    // For non stable position
                    vec4 mvPosition = modelViewMatrix * vec4( pos , 1.);

                    // For stable position;
                    // vec4 mvPosition = modelViewMatrix * vec4( stable , 1.);

                    gl_PointSize = 4000. * (1. / - mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;

                    vCoordinates = aCoordinates.xy;
                    vPos = pos;


                }
            `,
            uniforms:{
                progress:{
                    type:"f",value:0
                },
                t1 : {type:"t",value:textures[0]},
                t2 : {type:"t",value:textures[1]},
                mask: {type:"t",value:mask},
                mousePressed: {type:"f",value:0},
                mouse:{type:"v2",value:null},
                transition:{type:"f2",value:0},
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
            new Float32Array(number*3),1
        )
        let direction = new THREE.BufferAttribute(
            new Float32Array(number*3),1
        )
        let press = new THREE.BufferAttribute(
            new Float32Array(number*3),1
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
                offset.setX(index,rand(-1000,1000))
                speeds.setX(index,rand(0.4,1))
                direction.setX(index,Math.random() > 0.5 ? 1: -1)
                press.setX(index,rand(0.4,1))
                index++;
            }
        }

        geometry.setAttribute("position",positions)
        geometry.setAttribute("aCoordinates",coordinates)
        geometry.setAttribute("aOffset",offset)
        geometry.setAttribute("aSpeed",speeds)
        geometry.setAttribute("aPress",press)
        geometry.setAttribute("aDirection",direction)

        // material = new THREE.MeshNormalMaterial({side:THREE.DoubleSide});
        let mesh = new THREE.Points( geometry, material );
        scene.add( mesh );

        const planegeometry = new THREE.PlaneGeometry( 2000, 2000 );
        const planematerial = new THREE.MeshBasicMaterial( {color: 0xfdedff, side: THREE.DoubleSide} );
        const plane = new THREE.Mesh( planegeometry, planematerial );
        scene.add( plane );

        
        let settings = {
            progress:0,
        }

        // let gui = new GUI();
        // gui.add(settings,"progress",0,1)



        let test = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(2000,2000),
            new THREE.MeshBasicMaterial()
        )
        window.addEventListener("mousedown",(e) => {
            gsap.to(material.uniforms.mousePressed,{
                ease:"elastic.out(1,0.3)",
                duration:0.5,
                value:1
            })
        })

        window.addEventListener("mouseup",(e) => {
            gsap.to(material.uniforms.mousePressed,{
                duration:0.5,
                ease:"elastic.out(1,0.3)",
                value:0
            })
        })

        let next = 0;
        let prev = 0;
        
        var userHasScrolled = true;

        function isScrolled(userHasScrolled_) {
            if(userHasScrolled_){
                gsap.to(material.uniforms.transition,{
                    ease:"expo.inOut",
                    duration:3,
                    value: 1,
                    onComplete: function() {userHasScrolled = false}
                })
                console.log(userHasScrolled_)
            }
            
        }

        isScrolled(userHasScrolled)

        window.addEventListener("mousewheel",(e) => {

            move += e.wheelDeltaY/1000;
            next = Math.floor(move + 1000) % textures.length;
            prev = ( Math.floor(move) + textures.length + 1000) % textures.length;

            gsap.fromTo(material.uniforms.transition,{value:0},{
                ease:"strong.inOut",
                duration:2,
                value: 1,
                overwrite:true,
                onComplete: function() {userHasScrolled = false}
            })

        },false)
        
        window.addEventListener("mousemove",(event) => {
            mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

            raycaster.setFromCamera( mouse, camera );


            const intersects = raycaster.intersectObjects( [test] );

            point.x = intersects[0].point.x
            point.y = intersects[0].point.y

        },false);


        window.addEventListener("resize",() => {
            renderer.setSize(window.innerWidth,window.innerHeight)
            camera.aspect = window.innerWidth/window.innerHeight
            camera.updateProjectionMatrix()
        })
        
        function render() {
            time++;

            material.uniforms.t1.value = textures[prev];
            material.uniforms.t2.value = textures[next];


            material.uniforms.time.value = time;

            // material.uniforms.transition.value = settings.progress;


            material.uniforms.move.value = move;
            material.uniforms.mouse.value = point;
    
            renderer.render( scene, camera );
    
            window.requestAnimationFrame(render)

        }
        
        render()

    },[])

    return (
        <div className='container-fluid'>
            <div id="container"></div>
            <h1> Scroll on Desktop <br></br>/ Zoom in Cellphone </h1>
            <h2> Hold Click on Dekstop/CP </h2>
        </div>
    )
}

export default Main