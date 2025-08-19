// Variables globales para Three.js - Múltiples instancias para 2 dados
let scenes = {};
let cameras = {};
let renderers = {};
let worlds = {};
let diceGroups = {};
let tables = {};
let diceBodies = {};
let tableBodies = {};
let isAnimating = {};
let currentScene = 'scene-2d-1'; // Para controlar qué tipo de dados mostrar
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

        // Detectar si es dispositivo móvil
        const isMobile = window.innerWidth <= 768;

        // Si el contenedor no tiene dimensiones (no está visible), usar las dimensiones de la pestaña 1
        if (!width || !height) {
            const scene1Container = document.getElementById('threejs-container-scene2d1');
            if (scene1Container) {
                // En móvil, usar dimensiones fijas para evitar problemas de renderizado
                if (isMobile) {
                    return {
                        width: 427,
                        height: 250
                    };
                }
                return {
                    width: scene1Container.offsetWidth || 940,
                    height: scene1Container.offsetHeight || 350
                };
            }
        }

        // En móvil, forzar las dimensiones correctas
        if (isMobile) {
            return {
                width: 427,
                height: 250
            };
        }

        return {
            width: width || 940,
            height: height || 350
        };
    }

    // Detectar si es dispositivo móvil para el fallback
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        return { width: 427, height: 250 };
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
    cameras[containerId].position.set(0, 2, 8);
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

    // Configurar materiales de contacto
    const defaultMaterial = new CANNON.Material();
    const defaultContactMaterial = new CANNON.ContactMaterial(
        defaultMaterial,
        defaultMaterial,
        {
            friction: 0.01,
            restitution: 0.8
        }
    );

    // Material de contacto para paredes laterales con rebote moderado
    const wallContactMaterial = new CANNON.ContactMaterial(
        defaultMaterial,
        defaultMaterial,
        {
            friction: 0.2, // Aumentado de 0.0001 a 0.2
            restitution: 0.6 // Reducido de 0.99 a 0.6 para menos rebote
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
    // Table geometry - wider for 2 dice and longer towards front
    const tableGeometry = new THREE.BoxGeometry(12, 0.5, 7);
    const tableMaterial = new THREE.MeshLambertMaterial({ color: 0xa43419 });
    tables[containerId] = new THREE.Mesh(tableGeometry, tableMaterial);
    tables[containerId].position.set(0, -0.5, 0);
    tables[containerId].rotation.x = 0.3;
    tables[containerId].receiveShadow = true;
    scenes[containerId].add(tables[containerId]);

    // Table physics body
    const tableShape = new CANNON.Box(new CANNON.Vec3(6, 0.25, 3.5));
    tableBodies[containerId] = new CANNON.Body({ mass: 0 });
    tableBodies[containerId].addShape(tableShape);
    tableBodies[containerId].position.set(0, -0.5, 0);
    tableBodies[containerId].quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), 0.3);
    worlds[containerId].add(tableBodies[containerId]);
}

function createWalls(containerId) {
    // Detectar si es dispositivo móvil
    const isMobile = window.innerWidth <= 768;

    // Crear material específico para la pared frontal - muy resbaladizo
    const frontWallMaterial = new CANNON.Material();
    const defaultMaterial = new CANNON.Material();
    const frontWallContactMaterial = new CANNON.ContactMaterial(
        defaultMaterial,
        frontWallMaterial,
        {
            friction: 0.001, // Muy baja fricción para que el dado se deslice
            restitution: 0.3 // Bajo rebote para evitar que se pegue
        }
    );
    worlds[containerId].addContactMaterial(frontWallContactMaterial);

    // Ajustar posiciones de paredes laterales para móviles
    const leftWallX = isMobile ? -4.5 : -7;    // Más cerca del centro en móviles
    const rightWallX = isMobile ? 4.5 : 7;     // Más cerca del centro en móviles  // Backup walls también más cerca

    // Create multiple layers of walls for better containment

    // LAYER 1: Main walls (further out) - VISIBLE FOR DEBUG
    // Front wall (Z positive) - moved further and less tilted
    const wallFrontGeometry = new THREE.BoxGeometry(14, 8, 0.6);
    const wallFrontMaterial = new THREE.MeshLambertMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.0
    });
    const wallFrontMesh = new THREE.Mesh(wallFrontGeometry, wallFrontMaterial);
    wallFrontMesh.position.set(0, 2, 4.2);
    wallFrontMesh.rotation.x = 0.3; // Aumentada de 0.2 a 0.3 para mayor inclinación
    scenes[containerId].add(wallFrontMesh);

    const wallFrontShape = new CANNON.Box(new CANNON.Vec3(7, 4, 0.3));
    const wallFrontBody = new CANNON.Body({ mass: 0 });
    wallFrontBody.addShape(wallFrontShape);
    wallFrontBody.material = frontWallMaterial; // Asignar material específico para que se deslice
    wallFrontBody.position.set(0, 2, 4.2);
    wallFrontBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), 0.3); // Aumentada de 0.2 a 0.3
    worlds[containerId].add(wallFrontBody);

    // Back wall (Z negative) - tilted inward
    const wallBackGeometry = new THREE.BoxGeometry(14, 8, 0.6);
    const wallBackMaterial = new THREE.MeshLambertMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0
    });
    const wallBackMesh = new THREE.Mesh(wallBackGeometry, wallBackMaterial);
    wallBackMesh.position.set(0, 2, -4);
    wallBackMesh.rotation.x = 0.6;
    scenes[containerId].add(wallBackMesh);

    const wallBackShape = new CANNON.Box(new CANNON.Vec3(7, 4, 0.3));
    const wallBackBody = new CANNON.Body({ mass: 0 });
    wallBackBody.addShape(wallBackShape);
    wallBackBody.position.set(0, 2, -4);
    wallBackBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), 0.6);
    worlds[containerId].add(wallBackBody);

    // Left wall (X negative) - tilted inward
    const wallLeftGeometry = new THREE.BoxGeometry(0.6, 8, 8);
    const wallLeftMaterial = new THREE.MeshLambertMaterial({
        color: 0x0000ff,
        transparent: true,
        opacity: 0
    });
    const wallLeftMesh = new THREE.Mesh(wallLeftGeometry, wallLeftMaterial);
    wallLeftMesh.position.set(leftWallX, 2, 0);
    wallLeftMesh.rotation.z = 0.6;
    scenes[containerId].add(wallLeftMesh);

    const wallLeftShape = new CANNON.Box(new CANNON.Vec3(0.3, 4, 4));
    const wallLeftBody = new CANNON.Body({ mass: 0 });
    wallLeftBody.addShape(wallLeftShape);
    wallLeftBody.position.set(leftWallX, 2, 0);
    wallLeftBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), 0.6);
    worlds[containerId].add(wallLeftBody);

    // Right wall (X positive) - tilted inward
    const wallRightGeometry = new THREE.BoxGeometry(0.6, 8, 8);
    const wallRightMaterial = new THREE.MeshLambertMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0
    });
    const wallRightMesh = new THREE.Mesh(wallRightGeometry, wallRightMaterial);
    wallRightMesh.position.set(rightWallX, 2, 0);
    wallRightMesh.rotation.z = -0.6;
    scenes[containerId].add(wallRightMesh);

    const wallRightShape = new CANNON.Box(new CANNON.Vec3(0.3, 4, 4));
    const wallRightBody = new CANNON.Body({ mass: 0 });
    wallRightBody.addShape(wallRightShape);
    wallRightBody.position.set(rightWallX, 2, 0);
    wallRightBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), -0.6);
    worlds[containerId].add(wallRightBody);


    // LAYER 3: Ceiling to prevent dice from jumping out - VISIBLE FOR DEBUG
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

// Create dice for a specific scene
function createDice(containerId, sceneType = 'scene-2d-1') {
    if (!scenes[containerId] || !worlds[containerId]) {
        return;
    }

    // Remove existing dice if any
    if (diceGroups[containerId]) {
        scenes[containerId].remove(diceGroups[containerId]);
        if (diceBodies[containerId]) {
            diceBodies[containerId].forEach(body => {
                if (worlds[containerId]) {
                    worlds[containerId].remove(body);
                }
            });
        }
    }

    // Create dice group
    diceGroups[containerId] = new THREE.Group();
    diceBodies[containerId] = [];

    // Create two dice
    const dice1 = createSingleDice(sceneType, -1.5, 0); // Left dice
    const dice2 = createSingleDice(sceneType, 1.5, 0);  // Right dice

    diceGroups[containerId].add(dice1.mesh);
    diceGroups[containerId].add(dice2.mesh);
    diceBodies[containerId].push(dice1.body);
    diceBodies[containerId].push(dice2.body);

    // Add to scene and physics world
    scenes[containerId].add(diceGroups[containerId]);
    diceBodies[containerId].forEach(body => {
        if (worlds[containerId]) {
            worlds[containerId].add(body);
        }
    });
}

function createSingleDice(sceneType, xOffset, zOffset) {
    const diceGeometry = new THREE.BoxGeometry(1, 1, 1);

    // Use the same color as scene-3 in juego-1-dado (light gray)
    const diceColor = 0xdadada; // Light gray color like scene-3
    const diceMaterial = new THREE.MeshLambertMaterial({ color: diceColor });

    const diceMesh = new THREE.Mesh(diceGeometry, diceMaterial);
    diceMesh.position.set(xOffset, 3, zOffset);
    diceMesh.castShadow = true;
    diceMesh.receiveShadow = true;

    // Create physics body
    const diceShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    const diceBody = new CANNON.Body({ mass: 1 });
    diceBody.addShape(diceShape);
    diceBody.position.set(xOffset, 3, zOffset);

    // Add normal dice faces (same as scene-3 in juego-1-dado)
    createNormalDice(diceMesh);

    return { mesh: diceMesh, body: diceBody };
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
    let containerId = 'threejs-container-scene2d1';
    if (sceneType === 'scene-2d-2') {
        containerId = 'threejs-container-scene2d2';
    }

    if (isAnimating[containerId]) return;

    currentScene = sceneType;

    // Crear nuevos dados según el tipo de escena (igual que en juego de 1 dado)
    createDice(containerId, sceneType);

    // Alternar dirección de lanzamiento
    const isLeftThrow = throwDirection[containerId];

    // Aplicar velocidad inicial a ambos dados (reducida para evitar escapes)
    if (diceBodies[containerId] && diceBodies[containerId].length >= 2) {
        diceBodies[containerId].forEach((body, index) => {
            // Posición inicial según la dirección
            const startX = isLeftThrow ? -3 : 3;
            const startZ = index === 0 ? -0.5 : 0.5; // Separar ligeramente los dados
            body.position.set(startX, 2.5, startZ);

            // Aplicar velocidad inicial según la dirección - REDUCIDA para equipos lentos
            const baseVelocity = 3 + Math.random() * 1; // Reducido de 6-8 a 3-4
            const velocidadX = isLeftThrow ? baseVelocity : -baseVelocity; // Positiva desde izquierda, negativa desde derecha
            const velocidadY = 0;
            const velocidadZ = (Math.random() - 0.5) * 2; // Rango original

            body.velocity.set(velocidadX, velocidadY, velocidadZ);

            // Rotación como dado real
            const rotX = (Math.random() - 0.5) * 15; // Valores originales
            const rotY = (Math.random() - 0.5) * 15; // Valores originales
            const rotZ = (Math.random() - 0.5) * 15; // Valores originales

            body.angularVelocity.set(rotX, rotY, rotZ);
        });
    }

    // Cambiar dirección para el próximo lanzamiento
    throwDirection[containerId] = !isLeftThrow;

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
    const requiredStableFrames = 40; // Aumentado de 25 a 40 para mejor estabilidad
    let lastDice1Velocity = { x: 0, y: 0, z: 0 };
    let lastDice1AngularVelocity = { x: 0, y: 0, z: 0 };
    let lastDice2Velocity = { x: 0, y: 0, z: 0 };
    let lastDice2AngularVelocity = { x: 0, y: 0, z: 0 };

    // Detectar rendimiento y ajustar timing para laptops lentas
    const performanceMultiplier = (performance.now() % 100 > 50) ? 1.5 : 1;
    let minFramesBeforeDetection = Math.floor(60 * performanceMultiplier); // Aumentado y adaptativo

    const checkVelocity = () => {
        if (!diceBodies[containerId] || diceBodies[containerId].length < 2) {
            isAnimating[containerId] = false;
            return;
        }

        const dice1 = diceBodies[containerId][0];
        const dice2 = diceBodies[containerId][1];

        // Esperar más tiempo antes de empezar a detectar para evitar rebotes iniciales - COPIADO DE JUEGO-1-DADO
        if (minFramesBeforeDetection > 0) {
            minFramesBeforeDetection--;
            if (isAnimating[containerId]) {
                requestAnimationFrame(checkVelocity);
            }
            return;
        }

        // Verificar si ambos dados tienen velocidad muy baja - COPIADO DE JUEGO-1-DADO
        const dice1VelocityMagnitude = Math.sqrt(dice1.velocity.x * dice1.velocity.x + dice1.velocity.y * dice1.velocity.y + dice1.velocity.z * dice1.velocity.z);
        const dice1AngularMagnitude = Math.sqrt(dice1.angularVelocity.x * dice1.angularVelocity.x + dice1.angularVelocity.y * dice1.angularVelocity.y + dice1.angularVelocity.z * dice1.angularVelocity.z);

        const dice2VelocityMagnitude = Math.sqrt(dice2.velocity.x * dice2.velocity.x + dice2.velocity.y * dice2.velocity.y + dice2.velocity.z * dice2.velocity.z);
        const dice2AngularMagnitude = Math.sqrt(dice2.angularVelocity.x * dice2.angularVelocity.x + dice2.angularVelocity.y * dice2.angularVelocity.y + dice2.angularVelocity.z * dice2.angularVelocity.z);

        // Umbrales más estrictos para mayor precisión en laptops lentas
        const velocityThreshold = 0.03; // Reducido de 0.05 a 0.03
        const angularThreshold = 0.03;  // Reducido de 0.05 a 0.03
        const isLowVelocity = dice1VelocityMagnitude < velocityThreshold && dice1AngularMagnitude < angularThreshold &&
            dice2VelocityMagnitude < velocityThreshold && dice2AngularMagnitude < angularThreshold;

        // Verificar si las velocidades han cambiado muy poco (estable) - Umbrales más estrictos
        const dice1VelocityChange = Math.abs(dice1VelocityMagnitude - Math.sqrt(lastDice1Velocity.x * lastDice1Velocity.x + lastDice1Velocity.y * lastDice1Velocity.y + lastDice1Velocity.z * lastDice1Velocity.z));
        const dice1AngularChange = Math.abs(dice1AngularMagnitude - Math.sqrt(lastDice1AngularVelocity.x * lastDice1AngularVelocity.x + lastDice1AngularVelocity.y * lastDice1AngularVelocity.y + lastDice1AngularVelocity.z * lastDice1AngularVelocity.z));

        const dice2VelocityChange = Math.abs(dice2VelocityMagnitude - Math.sqrt(lastDice2Velocity.x * lastDice2Velocity.x + lastDice2Velocity.y * lastDice2Velocity.y + lastDice2Velocity.z * lastDice2Velocity.z));
        const dice2AngularChange = Math.abs(dice2AngularMagnitude - Math.sqrt(lastDice2AngularVelocity.x * lastDice2AngularVelocity.x + lastDice2AngularVelocity.y * lastDice2AngularVelocity.y + lastDice2AngularVelocity.z * lastDice2AngularVelocity.z));

        const changeThreshold = 0.003; // Reducido de 0.005 a 0.003 para mayor precisión
        const isStable = dice1VelocityChange < changeThreshold && dice1AngularChange < changeThreshold &&
            dice2VelocityChange < changeThreshold && dice2AngularChange < changeThreshold;

        if (isLowVelocity && isStable) {
            stableFrames++;
        } else {
            stableFrames = 0;
        }

        // Guardar velocidades actuales para la siguiente comparación
        lastDice1Velocity = { x: dice1.velocity.x, y: dice1.velocity.y, z: dice1.velocity.z };
        lastDice1AngularVelocity = { x: dice1.angularVelocity.x, y: dice1.angularVelocity.y, z: dice1.angularVelocity.z };
        lastDice2Velocity = { x: dice2.velocity.x, y: dice2.velocity.y, z: dice2.velocity.z };
        lastDice2AngularVelocity = { x: dice2.angularVelocity.x, y: dice2.angularVelocity.y, z: dice2.angularVelocity.z };

        // Si ha estado estable por suficientes frames, verificar posición adicional y sincronización visual
        if (stableFrames >= requiredStableFrames) {
            // Verificación adicional: asegurar que ambos dados estén en posición estable
            const dice1Position = dice1.position;
            const dice1Quaternion = dice1.quaternion;
            const dice2Position = dice2.position;
            const dice2Quaternion = dice2.quaternion;

            // Verificar que ambos dados estén cerca de la mesa (no rebotando alto)
            const isDice1NearTable = dice1Position.y < 1.5;
            const isDice2NearTable = dice2Position.y < 1.5;

            // Verificar que las rotaciones sean estables (no girando)
            const dice1RotationStability = Math.abs(dice1Quaternion.x) + Math.abs(dice1Quaternion.y) + Math.abs(dice1Quaternion.z) + Math.abs(dice1Quaternion.w - 1);
            const dice2RotationStability = Math.abs(dice2Quaternion.x) + Math.abs(dice2Quaternion.y) + Math.abs(dice2Quaternion.z) + Math.abs(dice2Quaternion.w - 1);
            const isDice1RotationStable = dice1RotationStability < 0.1;
            const isDice2RotationStable = dice2RotationStability < 0.1;

            // NUEVA: Verificación de sincronización visual-física
            const visualSync = checkVisualPhysicsSync(containerId);

            if (isDice1NearTable && isDice2NearTable && isDice1RotationStable && isDice2RotationStable && visualSync) {
                // Esperar un frame adicional para asegurar sincronización completa
                setTimeout(() => {
                    isAnimating[containerId] = false;
                    // Detectar ambos dados con confirmación
                    const result1 = detectDiceResultWithConfirmation(dice1, containerId);
                    const result2 = detectDiceResultWithConfirmation(dice2, containerId);
                    if (onDiceResultCallback) {
                        onDiceResultCallback({ d1: result1, d2: result2 });
                    }
                    if (onDiceAnimationEndCallback) {
                        onDiceAnimationEndCallback();
                    }
                }, 100); // 100ms adicionales para sincronización
                return;
            } else {
                // Si no están en posición estable o no hay sincronización, resetear contadores y continuar
                stableFrames = 0;
            }
        }

        if (isAnimating[containerId]) {
            requestAnimationFrame(checkVelocity);
        }
    };

    checkVelocity();

    // Backup timeout más largo para casos problemáticos - Aumentado para laptops lentas
    const backupTimeout = Math.floor(5000 * performanceMultiplier); // 5-7.5 segundos según rendimiento
    setTimeout(() => {
        if (isAnimating[containerId]) {
            // Detectar ambos dados con confirmación adicional
            const result1 = detectDiceResultWithConfirmation(diceBodies[containerId][0], containerId);
            const result2 = detectDiceResultWithConfirmation(diceBodies[containerId][1], containerId);
            isAnimating[containerId] = false;
            if (onDiceResultCallback) {
                onDiceResultCallback({ d1: result1, d2: result2 });
            }
            if (onDiceAnimationEndCallback) {
                onDiceAnimationEndCallback();
            }
        }
    }, backupTimeout);
}

// NUEVA: Función para verificar sincronización entre visual y física
function checkVisualPhysicsSync(containerId) {
    if (!diceGroups[containerId] || !diceBodies[containerId] || diceBodies[containerId].length < 2) {
        return false;
    }

    const visualDice1 = diceGroups[containerId].children[0];
    const visualDice2 = diceGroups[containerId].children[1];
    const physicalDice1 = diceBodies[containerId][0];
    const physicalDice2 = diceBodies[containerId][1];

    // Verificar que las posiciones visuales y físicas estén sincronizadas
    const positionTolerance = 0.1;
    const rotationTolerance = 0.1;

    const pos1Diff = visualDice1.position.distanceTo(physicalDice1.position);
    const pos2Diff = visualDice2.position.distanceTo(physicalDice2.position);

    const quat1Diff = Math.abs(
        visualDice1.quaternion.x - physicalDice1.quaternion.x +
        visualDice1.quaternion.y - physicalDice1.quaternion.y +
        visualDice1.quaternion.z - physicalDice1.quaternion.z +
        visualDice1.quaternion.w - physicalDice1.quaternion.w
    );

    const quat2Diff = Math.abs(
        visualDice2.quaternion.x - physicalDice2.quaternion.x +
        visualDice2.quaternion.y - physicalDice2.quaternion.y +
        visualDice2.quaternion.z - physicalDice2.quaternion.z +
        visualDice2.quaternion.w - physicalDice2.quaternion.w
    );

    return pos1Diff < positionTolerance && pos2Diff < positionTolerance &&
        quat1Diff < rotationTolerance && quat2Diff < rotationTolerance;
}

// NUEVA: Función de detección con confirmación múltiple
function detectDiceResultWithConfirmation(diceBody, containerId) {
    // Realizar múltiples detecciones para confirmar resultado
    const results = [];

    for (let i = 0; i < 3; i++) {
        const result = detectDiceResult(diceBody);
        results.push(result);
    }

    // Si todos los resultados coinciden, usar ese valor
    if (results[0] === results[1] && results[1] === results[2]) {
        return results[0];
    }

    // Si hay discrepancia, usar el resultado más común
    const resultCounts = {};
    results.forEach(result => {
        resultCounts[result] = (resultCounts[result] || 0) + 1;
    });

    let mostCommonResult = results[0];
    let maxCount = 0;

    for (const [result, count] of Object.entries(resultCounts)) {
        if (count > maxCount) {
            maxCount = count;
            mostCommonResult = parseInt(result);
        }
    }

    return mostCommonResult;
}

function detectDiceResult(diceBody) {
    const quaternion = diceBody.quaternion;
    const upVector = new THREE.Vector3(0, 1, 0);

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
    const raycastResult = detectDiceResultWithRaycast(diceBody);
    if (raycastResult !== null) {
        // Si el raycast es exitoso, usarlo como confirmación
        result = raycastResult;
    }

    return result;
}

function detectDiceResultWithRaycast(diceBody) {
    // Encontrar el contenedor correspondiente al dado
    let containerId = null;
    for (const [id, bodies] of Object.entries(diceBodies)) {
        if (bodies.includes(diceBody)) {
            containerId = id;
            break;
        }
    }

    if (!containerId || !scenes[containerId]) {
        return null;
    }

    const dicePosition = diceBody.position.clone();
    const rayOrigin = new THREE.Vector3(dicePosition.x, dicePosition.y, dicePosition.z);
    const rayDirection = new THREE.Vector3(0, 1, 0); // Hacia arriba

    // Crear el raycaster
    const raycaster = new THREE.Raycaster(rayOrigin, rayDirection, 0, 10);

    // Solo buscar el ceiling específicamente (más eficiente) - COPIADO DE JUEGO-1-DADO
    const ceiling = scenes[containerId].children.find(child =>
        child.geometry && child.geometry.type === 'BoxGeometry' &&
        child.position.y > 4 // El ceiling está en Y=5
    );

    if (!ceiling) {
        return null;
    }

    // Realizar el raycast solo contra el ceiling
    const intersects = raycaster.intersectObject(ceiling);

    // DEBUG: Visualizar el ray (activar/desactivar según necesidad)
    const enableRayDebug = true; // Cambiar a false para desactivar debug
    if (enableRayDebug) {
        visualizeDiceRay(containerId, rayOrigin, rayDirection, intersects.length > 0);
    }

    if (intersects.length > 0) {
        const hitPoint = intersects[0].point;
        const diceCenter = dicePosition;
        const distance = diceCenter.distanceTo(hitPoint);

        // Si la distancia es muy pequeña, significa que el dado está muy cerca del ceiling
        if (distance < 2.0) {
            // Usar el método de producto punto como respaldo
            const quaternion = diceBody.quaternion;
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

    // Si no hay intersección válida, retornar null
    return null;
}

function visualizeDiceRay(containerId, origin, direction, hit) {
    // Crear un ID único basado en la posición del dado para evitar conflictos
    const rayId = `ray_${Math.round(origin.x * 10)}_${Math.round(origin.z * 10)}`;

    // Remover solo el rayo anterior de este dado específico (basado en posición)
    const existingRay = scenes[containerId].children.find(child =>
        child.isRayDebug && child.userData.rayId === rayId
    );
    if (existingRay) {
        scenes[containerId].remove(existingRay);
    }

    // Asegurar que origin y direction sean THREE.Vector3
    const rayOrigin = new THREE.Vector3(origin.x, origin.y, origin.z);
    const rayDirection = new THREE.Vector3(direction.x, direction.y, direction.z);

    // Crear geometría del rayo
    const rayGeometry = new THREE.BufferGeometry().setFromPoints([
        rayOrigin,
        rayOrigin.clone().add(rayDirection.clone().multiplyScalar(10))
    ]);

    // Material del rayo con colores más distintivos
    const rayMaterial = new THREE.LineBasicMaterial({
        color: hit ? 0x00ff00 : 0xff0000,
        linewidth: 50, // Aún más grueso
        transparent: false,
        opacity: 0.8
    });

    const rayLine = new THREE.Line(rayGeometry, rayMaterial);
    rayLine.isRayDebug = true;
    rayLine.userData = {
        rayId: rayId,
        origin: origin,
        timestamp: Date.now(),
        hit: hit
    };
    scenes[containerId].add(rayLine);

    // Remover el rayo después de 5 segundos (más tiempo para análisis)
    setTimeout(() => {
        if (scenes[containerId] && scenes[containerId].children.includes(rayLine)) {
            //El raycast se desvanecerá y luego se eliminará
            const fadeOutDuration = 2000;
            rayLine.material.opacity = 0.5; // Comenzar con opacidad 0.5
            const fadeOutInterval = setInterval(() => {
                rayLine.material.opacity -= 0.05;
                if (rayLine.material.opacity <= 0) {
                    clearInterval(fadeOutInterval);
                    scenes[containerId].remove(rayLine);
                }
            }, fadeOutDuration / 10);
        }
    }, 2000);
}

function detectAlternativeResult(quaternion) {
    // Método mejorado: usar vectores de cara directamente
    const faces = [
        { value: 1, normal: new THREE.Vector3(0, 1, 0) },
        { value: 2, normal: new THREE.Vector3(0, -1, 0) },
        { value: 3, normal: new THREE.Vector3(0, 0, 1) },
        { value: 4, normal: new THREE.Vector3(0, 0, -1) },
        { value: 5, normal: new THREE.Vector3(1, 0, 0) },
        { value: 6, normal: new THREE.Vector3(-1, 0, 0) }
    ];

    const upVector = new THREE.Vector3(0, 1, 0);
    let maxDot = -1;
    let result = 1;

    faces.forEach(face => {
        const rotatedNormal = face.normal.clone().applyQuaternion(quaternion);
        const dot = rotatedNormal.dot(upVector);

        if (dot > maxDot) {
            maxDot = dot;
            result = face.value;
        }
    });

    // Solo retornar resultado si hay confianza suficiente (umbral más alto)
    if (maxDot > 0.8) {
        return result;
    }

    // Fallback: método de ángulos con umbrales más estrictos
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    const x = ((euler.x * 180 / Math.PI) % 360 + 360) % 360;
    const y = ((euler.y * 180 / Math.PI) % 360 + 360) % 360;
    const z = ((euler.z * 180 / Math.PI) % 360 + 360) % 360;

    // Usar umbrales más estrictos (20 grados en lugar de 30)
    if (Math.abs(x) < 20 || Math.abs(x) > 340) return 1;
    if (Math.abs(x) > 160 && Math.abs(x) < 200) return 2;
    if (Math.abs(z) < 20 || Math.abs(z) > 340) return 3;
    if (Math.abs(z) > 160 && Math.abs(z) < 200) return 4;
    if (Math.abs(y) < 20 || Math.abs(y) > 340) return 5;
    if (Math.abs(y) > 160 && Math.abs(y) < 200) return 6;

    // Último recurso: devolver el resultado del método de producto punto
    return result;
}

function isDiceStopped(diceBody) {
    // Umbrales más estrictos para mayor precisión en la detección
    const velocityThreshold = 0.03; // Reducido de 0.05 a 0.03
    const angularThreshold = 0.03;  // Reducido de 0.05 a 0.03

    return Math.abs(diceBody.velocity.x) < velocityThreshold &&
        Math.abs(diceBody.velocity.y) < velocityThreshold &&
        Math.abs(diceBody.velocity.z) < velocityThreshold &&
        Math.abs(diceBody.angularVelocity.x) < angularThreshold &&
        Math.abs(diceBody.angularVelocity.y) < angularThreshold &&
        Math.abs(diceBody.angularVelocity.z) < angularThreshold;
}

// Function to reset the dice (without rolling it)
function resetDice(sceneType) {
    // Determine the active container based on the scene
    let containerId = 'threejs-container-scene2d1';
    if (sceneType === 'scene-2d-2') {
        containerId = 'threejs-container-scene2d2';
    }

    if (isAnimating[containerId]) return;

    currentScene = sceneType;
    createDice(containerId, sceneType);

    // Position the dice in initial position without movement
    if (diceBodies[containerId] && diceBodies[containerId].length >= 2) {
        diceBodies[containerId][0].velocity.set(0, 0, 0);
        diceBodies[containerId][0].angularVelocity.set(0, 0, 0);
        diceBodies[containerId][0].position.set(-1.5, 3, 0);
        diceBodies[containerId][0].quaternion.set(0, 0, 0, 1);

        diceBodies[containerId][1].velocity.set(0, 0, 0);
        diceBodies[containerId][1].angularVelocity.set(0, 0, 0);
        diceBodies[containerId][1].position.set(1.5, 3, 0);
        diceBodies[containerId][1].quaternion.set(0, 0, 0, 1);
    }
}

function animate(containerId) {
    requestAnimationFrame(() => animate(containerId));

    // Actualizar física
    if (worlds[containerId]) {
        worlds[containerId].step(1 / 60);
    }

    // Sincronizar posición de los dados
    if (diceGroups[containerId] && diceBodies[containerId] && diceBodies[containerId].length >= 2) {
        diceGroups[containerId].children[0].position.copy(diceBodies[containerId][0].position);
        diceGroups[containerId].children[0].quaternion.copy(diceBodies[containerId][0].quaternion);

        diceGroups[containerId].children[1].position.copy(diceBodies[containerId][1].position);
        diceGroups[containerId].children[1].quaternion.copy(diceBodies[containerId][1].quaternion);
    }

    // Renderizar
    if (renderers[containerId] && scenes[containerId] && cameras[containerId]) {
        renderers[containerId].render(scenes[containerId], cameras[containerId]);
    }
}

// Manejar redimensionamiento de ventana
function handleResize() {
    // Get the reference dimensions from scene 1
    const scene1Size = getContainerSize('threejs-container-scene2d1');

    Object.keys(renderers).forEach(containerId => {
        // Use the same dimensions for all containers
        const { width, height } = scene1Size;
        if (cameras[containerId]) {
            cameras[containerId].aspect = width / height;
            cameras[containerId].updateProjectionMatrix();
        }
        if (renderers[containerId]) {
            renderers[containerId].setSize(width, height);
        }
        if (cameras[containerId]) {
            cameras[containerId].lookAt(0, 0, 0);
        }

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
    let containerId = 'threejs-container-scene2d1';
    if (sceneType === 'scene-2d-2') {
        containerId = 'threejs-container-scene2d2';
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
window.DiceTwoThreeJS = {
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