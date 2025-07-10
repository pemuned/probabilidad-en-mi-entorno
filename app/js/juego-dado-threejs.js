// Variables globales para Three.js - Múltiples instancias
let scenes = {};
let cameras = {};
let renderers = {};
let worlds = {};
let cubes = {};
let tables = {};
let cubeBodies = {};
let tableBodies = {};
let isAnimating = {};
let currentScene = 'scene-1'; // Para controlar qué tipo de dado mostrar
let isInitialized = {}; // Si Three.js ya está inicializado para cada contenedor
let throwDirection = {}; // Para alternar dirección de lanzamiento (true = izquierda, false = derecha)

// Callbacks para comunicar con la lógica del juego
let onDiceResultCallback = null;
let onDiceAnimationStartCallback = null;
let onDiceAnimationEndCallback = null;

// Función helper para calcular el ancho del contenedor
function getContainerSize(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        const width = container.offsetWidth;
        const height = container.offsetHeight;

        // Si el contenedor no tiene dimensiones (no está visible), usar las dimensiones de la pestaña 1
        if (!width || !height) {
            const scene1Container = document.getElementById('threejs-container-scene1');
            if (scene1Container) {
                return {
                    width: scene1Container.offsetWidth || 940,
                    height: scene1Container.offsetHeight || 350
                };
            }
        }

        return {
            width: width || 940,
            height: height || 350
        };
    }
    return { width: 940, height: 350 };
}

// Inicializar la escena Three.js para un contenedor específico
function initThreeJS(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    // Crear escena
    scenes[containerId] = new THREE.Scene();

    // Crear cámara en posición fija
    const { width, height } = getContainerSize(containerId);
    cameras[containerId] = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    cameras[containerId].position.set(0, 1.5, 5);
    cameras[containerId].lookAt(0, 0, 0);

    // Crear renderer
    renderers[containerId] = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderers[containerId].setClearColor(0x000000, 0);
    renderers[containerId].setSize(width, height);
    renderers[containerId].shadowMap.enabled = true;
    renderers[containerId].shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderers[containerId].domElement);

    // Crear mundo físico
    worlds[containerId] = new CANNON.World();
    worlds[containerId].gravity.set(0, -9.82, 0);
    worlds[containerId].broadphase = new CANNON.NaiveBroadphase();
    worlds[containerId].solver.iterations = 10;

    // Configurar materiales de contacto con mejor rebote para paredes
    const defaultMaterial = new CANNON.Material();
    const defaultContactMaterial = new CANNON.ContactMaterial(
        defaultMaterial,
        defaultMaterial,
        {
            friction: 0.01,
            restitution: 0.8
        }
    );

    // Material de contacto mejorado para paredes con más rebote
    const wallContactMaterial = new CANNON.ContactMaterial(
        defaultMaterial,
        defaultMaterial,
        {
            friction: 0.0001,
            restitution: 0.99
        }
    );

    worlds[containerId].addContactMaterial(defaultContactMaterial);
    worlds[containerId].addContactMaterial(wallContactMaterial);
    worlds[containerId].defaultContactMaterial = defaultContactMaterial;

    // Create table and walls
    createTable(containerId);
    createWalls(containerId);

    // Create lights
    createLights(containerId);

    // Marcar como inicializado
    isInitialized[containerId] = true;

    // Inicializar dirección de lanzamiento para este contenedor
    throwDirection[containerId] = true; // Comenzar desde la izquierda

    // Iniciar loop de animación para este contenedor
    animate(containerId);

    // Ocultar loader después de la inicialización
    setTimeout(() => {
        const loader = document.getElementById(`threejs-loader-${containerId.replace('threejs-container-', '')}`);
        if (loader) {
            loader.style.display = 'none';
        }
    }, 1000);

    return true;
}

function createTable(containerId) {
    // Table geometry
    const tableGeometry = new THREE.BoxGeometry(8, 0.5, 4);
    const tableMaterial = new THREE.MeshLambertMaterial({ color: 0xa43419 });
    tables[containerId] = new THREE.Mesh(tableGeometry, tableMaterial);
    tables[containerId].position.set(0, -0.5, 0);
    tables[containerId].rotation.x = 0.3;
    tables[containerId].receiveShadow = true;
    scenes[containerId].add(tables[containerId]);

    // Table physics body
    const tableShape = new CANNON.Box(new CANNON.Vec3(4, 0.25, 2));
    tableBodies[containerId] = new CANNON.Body({ mass: 0 });
    tableBodies[containerId].addShape(tableShape);
    tableBodies[containerId].position.set(0, -0.5, 0);
    tableBodies[containerId].quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), 0.3);
    worlds[containerId].add(tableBodies[containerId]);
}

function createWalls(containerId) {
    // Detectar si es dispositivo móvil
    const isMobile = window.innerWidth <= 768;

    // Ajustar posiciones de paredes laterales para móviles
    const leftWallX = isMobile ? -2.8 : -4.2;  // Más cerca del centro en móviles
    const rightWallX = isMobile ? 2.8 : 4.2;   // Más cerca del centro en móviles

    // Front wall (Z positive) - tilted inward - INVISIBLE
    const wallFrontGeometry = new THREE.BoxGeometry(8, 4, 0.2);
    const wallFrontMaterial = new THREE.MeshLambertMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.0
    });
    const wallFrontMesh = new THREE.Mesh(wallFrontGeometry, wallFrontMaterial);
    wallFrontMesh.position.set(0, 0.5, 2.2);
    wallFrontMesh.rotation.x = 0.2;
    scenes[containerId].add(wallFrontMesh);

    const wallFrontShape = new CANNON.Box(new CANNON.Vec3(4, 2, 0.1));
    const wallFrontBody = new CANNON.Body({ mass: 0 });
    wallFrontBody.addShape(wallFrontShape);
    wallFrontBody.position.set(0, 0.5, 2.2);
    wallFrontBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), 0.2);
    worlds[containerId].add(wallFrontBody);

    // Back wall (Z negative) - tilted inward - INVISIBLE
    const wallBackGeometry = new THREE.BoxGeometry(8, 4, 0.2);
    const wallBackMaterial = new THREE.MeshLambertMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.0
    });
    const wallBackMesh = new THREE.Mesh(wallBackGeometry, wallBackMaterial);
    wallBackMesh.position.set(0, 0.5, -2.2);
    wallBackMesh.rotation.x = 0.2;
    scenes[containerId].add(wallBackMesh);

    const wallBackShape = new CANNON.Box(new CANNON.Vec3(4, 2, 0.1));
    const wallBackBody = new CANNON.Body({ mass: 0 });
    wallBackBody.addShape(wallBackShape);
    wallBackBody.position.set(0, 0.5, -2.2);
    wallBackBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), 0.2);
    worlds[containerId].add(wallBackBody);

    // Left wall (X negative) - tilted inward - INVISIBLE
    const wallLeftGeometry = new THREE.BoxGeometry(0.2, 4, 4.4); // ancho de la pared, altura y la longitud
    const wallLeftMaterial = new THREE.MeshLambertMaterial({
        color: 0x0000ff,
        transparent: true,
        opacity: 0.0
    });
    const wallLeftMesh = new THREE.Mesh(wallLeftGeometry, wallLeftMaterial);
    wallLeftMesh.position.set(leftWallX, 0.5, 0);
    wallLeftMesh.rotation.z = 0.2;
    scenes[containerId].add(wallLeftMesh);

    const wallLeftShape = new CANNON.Box(new CANNON.Vec3(0.1, 2, 2.2));
    const wallLeftBody = new CANNON.Body({ mass: 0 });
    wallLeftBody.addShape(wallLeftShape);
    wallLeftBody.position.set(leftWallX, 0.5, 0);
    wallLeftBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), 0.2);
    worlds[containerId].add(wallLeftBody);

    // Right wall (X positive) - tilted inward - INVISIBLE
    const wallRightGeometry = new THREE.BoxGeometry(0.2, 4, 4.4);
    const wallRightMaterial = new THREE.MeshLambertMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.0
    });
    const wallRightMesh = new THREE.Mesh(wallRightGeometry, wallRightMaterial);
    wallRightMesh.position.set(rightWallX, 0.5, 0);
    wallRightMesh.rotation.z = -0.2;
    scenes[containerId].add(wallRightMesh);

    const wallRightShape = new CANNON.Box(new CANNON.Vec3(0.1, 2, 2.2));
    const wallRightBody = new CANNON.Body({ mass: 0 });
    wallRightBody.addShape(wallRightShape);
    wallRightBody.position.set(rightWallX, 0.5, 0);
    wallRightBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), -0.2);
    worlds[containerId].add(wallRightBody);

    // Ceiling to prevent dice from jumping out - VISIBLE FOR DEBUG
    const ceilingGeometry = new THREE.BoxGeometry(14, 0.2, 8);
    const ceilingMaterial = new THREE.MeshLambertMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.2
    });
    const ceilingMesh = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceilingMesh.position.set(0, 5, 0);
    ceilingMesh.rotation.x = 0.3;
    scenes[containerId].add(ceilingMesh);

    const ceilingShape = new CANNON.Box(new CANNON.Vec3(7, 0.1, 4));
    const ceilingBody = new CANNON.Body({ mass: 0 });
    ceilingBody.addShape(ceilingShape);
    ceilingBody.position.set(0, 5, 0);
    ceilingBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), 0.3);
    worlds[containerId].add(ceilingBody);
}

function createDice(containerId, sceneType = 'scene-1') {

    // Verify that the scene exists
    if (!scenes[containerId]) {
        return;
    }

    // Remove previous dice if it exists
    if (cubes[containerId]) {
        scenes[containerId].remove(cubes[containerId]);
        if (worlds[containerId] && cubeBodies[containerId]) {
            worlds[containerId].remove(cubeBodies[containerId]);
        }
    }

    // Create dice group
    const diceGroup = new THREE.Group();
    diceGroup.position.set(0, 2.5, 0);

    // Dice geometry - color depends on scene type
    const diceGeometry = new THREE.BoxGeometry(1, 1, 1);
    let diceColor = 0x66c3bb; // Default color for scene-1

    if (sceneType === 'scene-2') {
        diceColor = 0xebdb8f; // Yellow color for scene-2
    } else if (sceneType === 'scene-3') {
        diceColor = 0xdadada; // Light gray color for scene-3
    }

    const diceMaterial = new THREE.MeshLambertMaterial({ color: diceColor });
    const diceMesh = new THREE.Mesh(diceGeometry, diceMaterial);
    diceMesh.castShadow = true;
    diceGroup.add(diceMesh);

    // Create dots according to scene type
    if (sceneType === 'scene-1') {
        // Dice with empty faces
        createEmptyDice(diceGroup);
    } else if (sceneType === 'scene-2') {
        // Dice with all faces showing 1
        createAllOnesDice(diceGroup);
    } else if (sceneType === 'scene-3') {
        // Normal dice with different faces
        createNormalDice(diceGroup);
    }

    scenes[containerId].add(diceGroup);
    cubes[containerId] = diceGroup;

    // Dice physics body
    const diceShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    cubeBodies[containerId] = new CANNON.Body({ mass: 1 });
    cubeBodies[containerId].addShape(diceShape);
    cubeBodies[containerId].position.set(0, 2.5, 0);

    // Configure friction and bounce
    cubeBodies[containerId].material = new CANNON.Material();
    cubeBodies[containerId].material.friction = 0.2;
    cubeBodies[containerId].material.restitution = 0.8;

    worlds[containerId].add(cubeBodies[containerId]);
}

function createEmptyDice(diceGroup) {
    // Dice with empty faces - no dots to add
}

function createAllOnesDice(diceGroup) {
    const dotGeometry = new THREE.CircleGeometry(0.08, 16);
    const dotMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });

    // Add one dot in the center of each face
    const faces = [
        { pos: [0, 0.51, 0], rot: [-Math.PI / 2, 0, 0] },      // Top face
        { pos: [0, -0.51, 0], rot: [Math.PI / 2, 0, 0] },      // Bottom face
        { pos: [0, 0, 0.51], rot: [0, 0, 0] },                 // Front face
        { pos: [0, 0, -0.51], rot: [0, Math.PI, 0] },          // Back face
        { pos: [0.51, 0, 0], rot: [0, Math.PI / 2, 0] },       // Right face
        { pos: [-0.51, 0, 0], rot: [0, -Math.PI / 2, 0] }      // Left face
    ];

    faces.forEach(face => {
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        dot.position.set(...face.pos);
        dot.rotation.set(...face.rot);
        diceGroup.add(dot);
    });
}

function createNormalDice(diceGroup) {
    const dotGeometry = new THREE.CircleGeometry(0.08, 16);
    const dotMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });

    // Face 1 (1 dot) - Top face
    const dot1 = new THREE.Mesh(dotGeometry, dotMaterial);
    dot1.position.set(0, 0.51, 0);
    dot1.rotation.x = -Math.PI / 2;
    diceGroup.add(dot1);

    // Face 2 (2 dots) - Bottom face
    const dot2a = new THREE.Mesh(dotGeometry, dotMaterial);
    dot2a.position.set(-0.25, -0.51, 0.25);
    dot2a.rotation.x = Math.PI / 2;
    diceGroup.add(dot2a);

    const dot2b = new THREE.Mesh(dotGeometry, dotMaterial);
    dot2b.position.set(0.25, -0.51, -0.25);
    dot2b.rotation.x = Math.PI / 2;
    diceGroup.add(dot2b);

    // Face 3 (3 dots) - Front face
    const dot3a = new THREE.Mesh(dotGeometry, dotMaterial);
    dot3a.position.set(0, 0, 0.51);
    diceGroup.add(dot3a);

    const dot3b = new THREE.Mesh(dotGeometry, dotMaterial);
    dot3b.position.set(-0.25, -0.25, 0.51);
    diceGroup.add(dot3b);

    const dot3c = new THREE.Mesh(dotGeometry, dotMaterial);
    dot3c.position.set(0.25, 0.25, 0.51);
    diceGroup.add(dot3c);

    // Face 4 (4 dots) - Back face
    const dot4a = new THREE.Mesh(dotGeometry, dotMaterial);
    dot4a.position.set(-0.25, 0.25, -0.51);
    dot4a.rotation.y = Math.PI;
    diceGroup.add(dot4a);

    const dot4b = new THREE.Mesh(dotGeometry, dotMaterial);
    dot4b.position.set(0.25, 0.25, -0.51);
    dot4b.rotation.y = Math.PI;
    diceGroup.add(dot4b);

    const dot4c = new THREE.Mesh(dotGeometry, dotMaterial);
    dot4c.position.set(-0.25, -0.25, -0.51);
    dot4c.rotation.y = Math.PI;
    diceGroup.add(dot4c);

    const dot4d = new THREE.Mesh(dotGeometry, dotMaterial);
    dot4d.position.set(0.25, -0.25, -0.51);
    dot4d.rotation.y = Math.PI;
    diceGroup.add(dot4d);

    // Face 5 (5 dots) - Right face
    const dot5a = new THREE.Mesh(dotGeometry, dotMaterial);
    dot5a.position.set(0.51, 0, 0);
    dot5a.rotation.y = Math.PI / 2;
    diceGroup.add(dot5a);

    const dot5b = new THREE.Mesh(dotGeometry, dotMaterial);
    dot5b.position.set(0.51, -0.25, -0.25);
    dot5b.rotation.y = Math.PI / 2;
    diceGroup.add(dot5b);

    const dot5c = new THREE.Mesh(dotGeometry, dotMaterial);
    dot5c.position.set(0.51, 0.25, 0.25);
    dot5c.rotation.y = Math.PI / 2;
    diceGroup.add(dot5c);

    const dot5d = new THREE.Mesh(dotGeometry, dotMaterial);
    dot5d.position.set(0.51, -0.25, 0.25);
    dot5d.rotation.y = Math.PI / 2;
    diceGroup.add(dot5d);

    const dot5e = new THREE.Mesh(dotGeometry, dotMaterial);
    dot5e.position.set(0.51, 0.25, -0.25);
    dot5e.rotation.y = Math.PI / 2;
    diceGroup.add(dot5e);

    // Face 6 (6 dots) - Left face
    const dot6a = new THREE.Mesh(dotGeometry, dotMaterial);
    dot6a.position.set(-0.51, 0.25, 0.25);
    dot6a.rotation.y = -Math.PI / 2;
    diceGroup.add(dot6a);

    const dot6b = new THREE.Mesh(dotGeometry, dotMaterial);
    dot6b.position.set(-0.51, 0.25, -0.25);
    dot6b.rotation.y = -Math.PI / 2;
    diceGroup.add(dot6b);

    const dot6c = new THREE.Mesh(dotGeometry, dotMaterial);
    dot6c.position.set(-0.51, 0, 0.25);
    dot6c.rotation.y = -Math.PI / 2;
    diceGroup.add(dot6c);

    const dot6d = new THREE.Mesh(dotGeometry, dotMaterial);
    dot6d.position.set(-0.51, 0, -0.25);
    dot6d.rotation.y = -Math.PI / 2;
    diceGroup.add(dot6d);

    const dot6e = new THREE.Mesh(dotGeometry, dotMaterial);
    dot6e.position.set(-0.51, -0.25, 0.25);
    dot6e.rotation.y = -Math.PI / 2;
    diceGroup.add(dot6e);

    const dot6f = new THREE.Mesh(dotGeometry, dotMaterial);
    dot6f.position.set(-0.51, -0.25, -0.25);
    dot6f.rotation.y = -Math.PI / 2;
    diceGroup.add(dot6f);
}

function createLights(containerId) {
    // Ambient light - increased intensity for better overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scenes[containerId].add(ambientLight);

    // Main directional light (sun) - increased intensity
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scenes[containerId].add(directionalLight);
}

// Function to roll the dice
function rollDice(sceneType) {
    // Determine the active container based on the scene
    let containerId = 'threejs-container-scene1';
    if (sceneType === 'scene-2') {
        containerId = 'threejs-container-scene2';
    } else if (sceneType === 'scene-3') {
        containerId = 'threejs-container-scene3';
    }

    if (isAnimating[containerId]) return;

    currentScene = sceneType;

    // Crear nuevo dado según el tipo de escena
    createDice(containerId, sceneType);

    // Para escenas 1 y 2, mostrar resultado inmediatamente
    if (sceneType === 'scene-1' || sceneType === 'scene-2') {
        isAnimating[containerId] = true;

        // Notificar inicio de animación
        if (onDiceAnimationStartCallback) {
            onDiceAnimationStartCallback();
        }

        // Mostrar resultado inmediatamente
        setTimeout(() => {
            const immediateResult = sceneType === 'scene-1' ? 0 : 1;
            if (onDiceResultCallback) {
                onDiceResultCallback(immediateResult);
            }
            isAnimating[containerId] = false;
            if (onDiceAnimationEndCallback) {
                onDiceAnimationEndCallback();
            }
        }, 100); // Pequeño delay para que se vea la animación inicial

        // Simular lanzamiento físico para efectos visuales
        const isLeftThrow = throwDirection[containerId];

        // Detectar si es dispositivo móvil y ajustar posición inicial
        const isMobile = window.innerWidth <= 768;
        const startX = isLeftThrow ? (isMobile ? -2.2 : -3) : (isMobile ? 2.2 : 3);
        cubeBodies[containerId].position.set(startX, 2.5, 0);

        const baseVelocity = 6 + Math.random() * 2;
        const velocidadX = isLeftThrow ? baseVelocity : -baseVelocity;
        const velocidadY = 0;
        const velocidadZ = (Math.random() - 0.5) * 2;

        cubeBodies[containerId].velocity.set(velocidadX, velocidadY, velocidadZ);
        throwDirection[containerId] = !isLeftThrow;

        const rotX = (Math.random() - 0.5) * 15;
        const rotY = (Math.random() - 0.5) * 15;
        const rotZ = (Math.random() - 0.5) * 15;

        cubeBodies[containerId].angularVelocity.set(rotX, rotY, rotZ);

        return;
    }

    // Para escena 3, comportamiento normal con detección mejorada
    const isLeftThrow = throwDirection[containerId];

    // Posición inicial según la dirección
    // Detectar si es dispositivo móvil y ajustar posición inicial
    const isMobile = window.innerWidth <= 768;
    const startX = isLeftThrow ? (isMobile ? -2.2 : -3) : (isMobile ? 2.2 : 3);
    cubeBodies[containerId].position.set(startX, 2.5, 0);

    // Aplicar velocidad inicial según la dirección
    const baseVelocity = 6 + Math.random() * 2;
    const velocidadX = isLeftThrow ? baseVelocity : -baseVelocity; // Positiva desde izquierda, negativa desde derecha
    const velocidadY = 0;
    const velocidadZ = (Math.random() - 0.5) * 2;

    cubeBodies[containerId].velocity.set(velocidadX, velocidadY, velocidadZ);

    // Cambiar dirección para el próximo lanzamiento
    throwDirection[containerId] = !isLeftThrow;

    // Rotación como dado real
    const rotX = (Math.random() - 0.5) * 15;
    const rotY = (Math.random() - 0.5) * 15;
    const rotZ = (Math.random() - 0.5) * 15;

    cubeBodies[containerId].angularVelocity.set(rotX, rotY, rotZ);

    isAnimating[containerId] = true;

    // Notificar inicio de animación
    if (onDiceAnimationStartCallback) {
        onDiceAnimationStartCallback();
    }

    // Detect result when the dice stops
    detectResultWhenStopped(containerId);
}

function detectResultWhenStopped(containerId) {
    let stableFrames = 0;
    const requiredStableFrames = 25; // Aumentado para ser más estricto
    let lastVelocity = { x: 0, y: 0, z: 0 };
    let lastAngularVelocity = { x: 0, y: 0, z: 0 };
    let minFramesBeforeDetection = 30; // Esperar más tiempo antes de empezar a detectar

    const checkVelocity = () => {
        if (!cubeBodies[containerId]) return;

        const velocity = cubeBodies[containerId].velocity;
        const angularVelocity = cubeBodies[containerId].angularVelocity;

        const velocityMagnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);
        const angularVelocityMagnitude = Math.sqrt(angularVelocity.x * angularVelocity.x + angularVelocity.y * angularVelocity.y + angularVelocity.z * angularVelocity.z);

        // Esperar más tiempo antes de empezar a detectar para evitar rebotes iniciales
        if (minFramesBeforeDetection > 0) {
            minFramesBeforeDetection--;
            if (isAnimating[containerId]) {
                requestAnimationFrame(checkVelocity);
            }
            return;
        }

        // Verificar si la velocidad es muy baja (umbral más estricto)
        const isLowVelocity = velocityMagnitude < 0.05 && angularVelocityMagnitude < 0.05;

        // Verificar si la velocidad ha cambiado muy poco (estable) - umbral más estricto
        const velocityChange = Math.abs(velocityMagnitude - Math.sqrt(lastVelocity.x * lastVelocity.x + lastVelocity.y * lastVelocity.y + lastVelocity.z * lastVelocity.z));
        const angularChange = Math.abs(angularVelocityMagnitude - Math.sqrt(lastAngularVelocity.x * lastAngularVelocity.x + lastAngularVelocity.y * lastAngularVelocity.y + lastAngularVelocity.z * lastAngularVelocity.z));
        const isStable = velocityChange < 0.005 && angularChange < 0.005; // Umbral más estricto

        if (isLowVelocity && isStable) {
            stableFrames++;
        } else {
            stableFrames = 0;
        }

        // Guardar velocidades actuales para la siguiente comparación
        lastVelocity = { x: velocity.x, y: velocity.y, z: velocity.z };
        lastAngularVelocity = { x: angularVelocity.x, y: angularVelocity.y, z: angularVelocity.z };

        // Si ha estado estable por suficientes frames, verificar posición adicional
        if (stableFrames >= requiredStableFrames) {
            // Verificación adicional: asegurar que el dado esté en una posición estable
            const dicePosition = cubeBodies[containerId].position;
            const diceQuaternion = cubeBodies[containerId].quaternion;

            // Verificar que el dado esté cerca de la mesa (no rebotando alto)
            const isNearTable = dicePosition.y < 1.5;

            // Verificar que la rotación sea estable (no girando)
            const rotationStability = Math.abs(diceQuaternion.x) + Math.abs(diceQuaternion.y) + Math.abs(diceQuaternion.z) + Math.abs(diceQuaternion.w - 1);
            const isRotationStable = rotationStability < 0.1;

            if (isNearTable && isRotationStable) {
                detectResult(containerId);
                isAnimating[containerId] = false;
                if (onDiceAnimationEndCallback) {
                    onDiceAnimationEndCallback();
                }
                return;
            } else {
                // Si no está en posición estable, resetear contadores y continuar
                stableFrames = 0;
            }
        }

        if (isAnimating[containerId]) {
            requestAnimationFrame(checkVelocity);
        }
    };

    checkVelocity();

    // Backup timeout más largo para casos problemáticos
    setTimeout(() => {
        if (isAnimating[containerId]) {
            detectResult(containerId);
            isAnimating[containerId] = false;
            if (onDiceAnimationEndCallback) {
                onDiceAnimationEndCallback();
            }
        }
    }, 3500); // Aumentado a 3500ms para dar más tiempo
}

function detectResult(containerId) {
    if (!cubes[containerId]) return;

    const quaternion = cubes[containerId].quaternion;
    const upVector = new THREE.Vector3(0, 1, 0);

    // Mapeo de caras del dado según la orientación estándar
    // En un dado estándar: 1 arriba, 2 abajo, 3 frente, 4 atrás, 5 derecha, 6 izquierda
    const faces = [
        { value: 1, normal: new THREE.Vector3(0, 1, 0) },   // Arriba
        { value: 2, normal: new THREE.Vector3(0, -1, 0) },  // Abajo
        { value: 3, normal: new THREE.Vector3(0, 0, 1) },   // Frente
        { value: 4, normal: new THREE.Vector3(0, 0, -1) },  // Atrás
        { value: 5, normal: new THREE.Vector3(1, 0, 0) },   // Derecha
        { value: 6, normal: new THREE.Vector3(-1, 0, 0) }   // Izquierda
    ];

    let maxDot = -1;
    let result = 1;

    // Calcular qué cara está más orientada hacia arriba
    faces.forEach(face => {
        const rotatedNormal = face.normal.clone().applyQuaternion(quaternion);
        const dot = rotatedNormal.dot(upVector);

        if (dot > maxDot) {
            maxDot = dot;
            result = face.value;
        }
    });

    // Si ninguna cara está claramente orientada hacia arriba, usar método alternativo
    if (maxDot < 0.7) {
        result = detectAlternativeResult(quaternion);
    }

    // CONFIRMACIÓN CON RAYCAST
    const raycastResult = detectResultWithRaycast(containerId);
    if (raycastResult !== null) {
        // Si el raycast es exitoso, usarlo como confirmación
        result = raycastResult;
    }

    if (onDiceResultCallback) {
        onDiceResultCallback(result);
    }
}

function detectResultWithRaycast(containerId) {
    if (!cubes[containerId] || !scenes[containerId]) return null;

    const dicePosition = cubes[containerId].position.clone();
    const rayOrigin = dicePosition;
    const rayDirection = new THREE.Vector3(0, 1, 0); // Hacia arriba

    // Crear el raycaster
    const raycaster = new THREE.Raycaster(rayOrigin, rayDirection, 0, 10);

    // Solo buscar el ceiling específicamente (más eficiente)
    const ceiling = scenes[containerId].children.find(child =>
        child.geometry && child.geometry.type === 'BoxGeometry' &&
        child.position.y > 4 // El ceiling está en Y=5
    );

    if (!ceiling) return null;

    // Realizar el raycast solo contra el ceiling
    const intersects = raycaster.intersectObject(ceiling);

    if (intersects.length > 0) {
        const hitPoint = intersects[0].point;
        const diceCenter = dicePosition;
        const distance = diceCenter.distanceTo(hitPoint);

        // Si la distancia es muy pequeña, significa que el dado está muy cerca del ceiling
        if (distance < 2.0) {
            // Usar el método de producto punto como respaldo
            const quaternion = cubes[containerId].quaternion;
            const faces = [
                { value: 1, normal: new THREE.Vector3(0, 1, 0) },
                { value: 2, normal: new THREE.Vector3(0, -1, 0) },
                { value: 3, normal: new THREE.Vector3(0, 0, 1) },
                { value: 4, normal: new THREE.Vector3(0, 0, -1) },
                { value: 5, normal: new THREE.Vector3(1, 0, 0) },
                { value: 6, normal: new THREE.Vector3(-1, 0, 0) }
            ];

            let maxDot = -1;
            let result = 1;

            faces.forEach(face => {
                const rotatedNormal = face.normal.clone().applyQuaternion(quaternion);
                const dot = rotatedNormal.dot(new THREE.Vector3(0, 1, 0));

                if (dot > maxDot) {
                    maxDot = dot;
                    result = face.value;
                }
            });

            return result;
        }
    }

    return null;
}

function visualizeRay(containerId, origin, direction, hit) {
    // Remover rayo anterior si existe
    const existingRay = scenes[containerId].children.find(child => child.isRayDebug);
    if (existingRay) {
        scenes[containerId].remove(existingRay);
    }

    // Crear geometría del rayo
    const rayGeometry = new THREE.BufferGeometry().setFromPoints([
        origin,
        origin.clone().add(direction.clone().multiplyScalar(10))
    ]);

    // Material del rayo (rojo si no hit, verde si hit)
    const rayMaterial = new THREE.LineBasicMaterial({
        color: hit ? 0x00ff00 : 0xff0000,
        linewidth: 2
    });

    const rayLine = new THREE.Line(rayGeometry, rayMaterial);
    rayLine.isRayDebug = true; // Marcar para poder removerlo después
    scenes[containerId].add(rayLine);

    // Remover el rayo después de 2 segundos
    setTimeout(() => {
        if (scenes[containerId] && scenes[containerId].children.includes(rayLine)) {
            scenes[containerId].remove(rayLine);
        }
    }, 2000);
}

function detectAlternativeResult(quaternion) {
    const euler = new THREE.Euler().setFromQuaternion(quaternion);

    // Normalizar ángulos a 0-360 grados
    const x = ((euler.x * 180 / Math.PI) % 360 + 360) % 360;
    const y = ((euler.y * 180 / Math.PI) % 360 + 360) % 360;
    const z = ((euler.z * 180 / Math.PI) % 360 + 360) % 360;

    // Determinar qué cara está más orientada hacia arriba basándose en los ángulos
    // Usar un umbral más estricto para evitar resultados incorrectos

    // Rotación en X (arriba/abajo)
    if (Math.abs(x) < 30 || Math.abs(x) > 330) {
        return 1; // Cara 1 hacia arriba
    } else if (Math.abs(x) > 150 && Math.abs(x) < 210) {
        return 2; // Cara 2 hacia arriba
    }

    // Rotación en Z (frente/atrás)
    if (Math.abs(z) < 30 || Math.abs(z) > 330) {
        return 3; // Cara 3 hacia arriba
    } else if (Math.abs(z) > 150 && Math.abs(z) < 210) {
        return 4; // Cara 4 hacia arriba
    }

    // Rotación en Y (derecha/izquierda)
    if (Math.abs(y) < 30 || Math.abs(y) > 330) {
        return 5; // Cara 5 hacia arriba
    } else if (Math.abs(y) > 150 && Math.abs(y) < 210) {
        return 6; // Cara 6 hacia arriba
    }

    // Si no se puede determinar claramente, usar el valor más cercano
    const angles = [x, y, z];
    const minAngle = Math.min(...angles.map(angle => Math.min(angle, 360 - angle)));

    if (minAngle === Math.min(x, 360 - x)) {
        return x < 180 ? 1 : 2;
    } else if (minAngle === Math.min(z, 360 - z)) {
        return z < 180 ? 3 : 4;
    } else {
        return y < 180 ? 5 : 6;
    }
}

// Function to reset the dice (without rolling it)
function resetDice(sceneType) {
    // Determine the active container based on the scene
    let containerId = 'threejs-container-scene1';
    if (sceneType === 'scene-2') {
        containerId = 'threejs-container-scene2';
    } else if (sceneType === 'scene-3') {
        containerId = 'threejs-container-scene3';
    }

    if (isAnimating[containerId]) return;

    currentScene = sceneType;
    createDice(containerId, sceneType);

    // Position the dice in initial position without movement
    cubeBodies[containerId].velocity.set(0, 0, 0);
    cubeBodies[containerId].angularVelocity.set(0, 0, 0);
    cubeBodies[containerId].position.set(0, 2.5, 0);
    cubeBodies[containerId].quaternion.set(0, 0, 0, 1);
}

function animate(containerId) {
    requestAnimationFrame(() => animate(containerId));

    // Actualizar física
    worlds[containerId].step(1 / 60);

    // Sincronizar posición del dado
    if (cubes[containerId] && cubeBodies[containerId]) {
        cubes[containerId].position.copy(cubeBodies[containerId].position);
        cubes[containerId].quaternion.copy(cubeBodies[containerId].quaternion);
    }

    // Renderizar
    renderers[containerId].render(scenes[containerId], cameras[containerId]);
}

// Manejar redimensionamiento de ventana
function handleResize() {
    // Get the reference dimensions from scene 1
    const scene1Size = getContainerSize('threejs-container-scene1');

    Object.keys(renderers).forEach(containerId => {
        // Use the same dimensions for all containers
        const { width, height } = scene1Size;
        cameras[containerId].aspect = width / height;
        cameras[containerId].updateProjectionMatrix();
        renderers[containerId].setSize(width, height);
        cameras[containerId].lookAt(0, 0, 0);

        // Recrear paredes si es necesario para ajustar a móviles
        if (isInitialized[containerId]) {
            // Remover paredes existentes (esto es simplificado, en una implementación completa
            // necesitarías mantener referencias a las paredes para removerlas)
            // Por ahora, solo actualizamos la cámara y el renderer
        }
    });
}

// Function to change scene
function changeScene(sceneType) {
    currentScene = sceneType;
    // Determine the active container based on the scene
    let containerId = 'threejs-container-scene1';
    if (sceneType === 'scene-2') {
        containerId = 'threejs-container-scene2';
    } else if (sceneType === 'scene-3') {
        containerId = 'threejs-container-scene3';
    }
    resetDice(sceneType);
}

// Function to change the active container
function changeContainer(containerId) {
    // Verify that the container exists
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    // Ensure the container is initialized
    if (!isInitialized[containerId]) {
        initThreeJS(containerId);
    }

    // Force resize to ensure correct dimensions
    if (renderers[containerId] && cameras[containerId]) {
        const { width, height } = getContainerSize(containerId);
        cameras[containerId].aspect = width / height;
        cameras[containerId].updateProjectionMatrix();
        renderers[containerId].setSize(width, height);
    }

    // Create dice for the current scene
    createDice(containerId, currentScene);
}

// Export functions for external use
window.DiceThreeJS = {
    init: initThreeJS,
    rollDice: rollDice,
    resetDice: resetDice,
    changeScene: changeScene,
    changeContainer: changeContainer,
    handleResize: handleResize,
    setOnDiceResult: (callback) => { onDiceResultCallback = callback; },
    setOnDiceAnimationStart: (callback) => { onDiceAnimationStartCallback = callback; },
    setOnDiceAnimationEnd: (callback) => { onDiceAnimationEndCallback = callback; }
}; 