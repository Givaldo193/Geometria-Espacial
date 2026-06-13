
// ==========================================
// --- CONFIGURAÇÃO DO THREE.JS (Cenário) ---
// ==========================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x020617, 5, 15); // Efeito de profundidade

// Configuração da Câmera
const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(3, 3, 7);
camera.lookAt(0, 0, 0);

// Configuração do Renderizador WebGL
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Iluminação do Cenário
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
keyLight.position.set(5, 8, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.3);
fillLight.position.set(-5, -2, -2);
scene.add(fillLight);

// Materiais Estilizados para os Sólidos
const materialMain = new THREE.MeshStandardMaterial({
    color: 0x10b981, roughness: 0.5, metalness: 0.2, flatShading: true 
});
const materialBase = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9, roughness: 0.6, metalness: 0.1, flatShading: true
});

// Material do Wireframe (Segmentos traseiros translúcidos)
const wireframeMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.15,
    depthWrite: false
});

let currentObjectGroup;

// ==========================================
// --- LÓGICA DE INTERAÇÃO (Rotacionar) ---
// ==========================================
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let autoRotation = { x: 0.002, y: 0.004 };

const startDrag = (x, y) => { 
    isDragging = true; 
    previousMousePosition = { x, y }; 
    autoRotation = { x: 0, y: 0 }; // Para o giro automático ao interagir
};

const endDrag = () => { isDragging = false; };

const moveDrag = (x, y) => {
    if (isDragging && currentObjectGroup) {
        const deltaMove = { x: x - previousMousePosition.x, y: y - previousMousePosition.y };
        currentObjectGroup.rotation.y += deltaMove.x * 0.01;
        currentObjectGroup.rotation.x += deltaMove.y * 0.01;
        previousMousePosition = { x, y };
    }
};

// Eventos de Mouse
container.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
window.addEventListener('mouseup', endDrag);
window.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));

// Eventos de Toque (Mobile)
container.addEventListener('touchstart', (e) => startDrag(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
window.addEventListener('touchend', endDrag);
window.addEventListener('touchmove', (e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

// ==========================================
// --- BANCO DE DADOS DAS FORMAS E FÓRMULAS ---
// ==========================================
const shapeConfigs = {
    cube: {
        name: "Paralelepípedo / Cubo",
        params: [
            { id: 'width', label: 'Largura (a)', min: 0.5, max: 3, step: 0.1, value: 2 },
            { id: 'height', label: 'Altura (b)', min: 0.5, max: 3, step: 0.1, value: 1.5 },
            { id: 'depth', label: 'Profundidade (c)', min: 0.5, max: 3, step: 0.1, value: 1 }
        ],
        formulas: `
            <p><strong class="text-sky-400">Área da Base (Ab):</strong><br>a × c</p>
            <p><strong class="text-emerald-400">Área Total (At):</strong><br>2 × (a·b + a·c + b·c)</p>
            <p><strong class="text-white">Volume (V):</strong><br>a × b × c</p>
        `
    },
    sphere: {
        name: "Esfera",
        params: [
            { id: 'radius', label: 'Raio (r)', min: 0.5, max: 2.2, step: 0.1, value: 1.5 },
            { id: 'segments', label: 'Resolução', min: 8, max: 48, step: 2, value: 24 }
        ],
        formulas: `
            <p><strong class="text-emerald-400">Área da Superfície (A):</strong><br>4 × π × r²</p>
            <p><strong class="text-white">Volume (V):</strong><br>(4/3) × π × r³</p>
        `
    },
    cylinder: {
        name: "Cilindro Circular Reto",
        params: [
            { id: 'radius', label: 'Raio da Base (r)', min: 0.3, max: 2, step: 0.1, value: 1 },
            { id: 'height', label: 'Altura (h)', min: 0.5, max: 4, step: 0.1, value: 2.5 },
            { id: 'segments', label: 'Segmentos', min: 8, max: 64, step: 1, value: 32 }
        ],
        formulas: `
            <p><strong class="text-sky-400">Área da Base (Ab):</strong><br>π × r²</p>
            <p><strong class="text-emerald-400">Área Lateral (Al):</strong><br>2 × π × r × h</p>
            <p><strong class="text-emerald-300">Área Total (At):</strong><br>2×Ab + Al</p>
            <p><strong class="text-white">Volume (V):</strong><br>Ab × h</p>
        `
    },
    cone: {
        name: "Cone Circular Reto",
        params: [
            { id: 'radius', label: 'Raio da Base (r)', min: 0.2, max: 2, step: 0.1, value: 1.2 },
            { id: 'height', label: 'Altura (h)', min: 0.5, max: 4, step: 0.1, value: 2.5 },
            { id: 'segments', label: 'Segmentos', min: 6, max: 64, step: 1, value: 24 }
        ],
        formulas: `
            <p><strong class="text-sky-400">Área da Base (Ab):</strong><br>π × r²</p>
            <p class="text-xs text-slate-400">Geratriz (g) = √(r² + h²)</p>
            <p><strong class="text-emerald-400">Área Lateral (Al):</strong><br>π × r × g</p>
            <p><strong class="text-white">Volume (V):</strong><br>(1/3) × Ab × h</p>
        `
    },
    pyramid: {
        name: "Pirâmide Quadrangular Reta",
        params: [
            { id: 'baseW', label: 'Lado da Base (l)', min: 0.5, max: 3, step: 0.1, value: 2 },
            { id: 'height', label: 'Altura (h)', min: 0.5, max: 4, step: 0.1, value: 2.5 }
        ],
        formulas: `
            <p><strong class="text-sky-400">Área da Base (Ab):</strong><br>l × l (ou l²)</p>
            <p class="text-xs text-slate-400">Apótema Lateral (al) = √(h² + (l/2)²)</p>
            <p><strong class="text-emerald-400">Área Lateral (Al):</strong><br>2 × l × al</p>
            <p><strong class="text-white">Volume (V):</strong><br>(1/3) × Ab × h</p>
        `
    }
};

const shapeSelect = document.getElementById('shape-select');
const controlsContainer = document.getElementById('controls-container');
const formulaContainer = document.getElementById('formula-container');

// ==========================================
// --- GERENCIAMENTO DE INTERFACE E GEOMETRIA ---
// ==========================================

// Função que reconstrói os inputs dinamicamente
function generateControls(shapeKey) {
    controlsContainer.innerHTML = '';
    const config = shapeConfigs[shapeKey];

    // Injeta as fórmulas do objeto selecionado
    formulaContainer.innerHTML = `<h3 class="font-bold text-emerald-300 text-base mb-2">${config.name}</h3>${config.formulas}`;

    // Constrói os sliders na barra lateral
    config.params.forEach(param => {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-col gap-1';
        wrapper.innerHTML = `
            <div class="flex justify-between text-xs text-slate-400 font-medium">
                <label for="${param.id}">${param.label}</label>
                <span id="${param.id}-val" class="text-white font-mono bg-slate-700 px-1.5 rounded">${param.value.toFixed(1)}</span>
            </div>
            <input type="range" id="${param.id}" min="${param.min}" max="${param.max}" step="${param.step}" value="${param.value}" 
                class="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500">
        `;
        controlsContainer.appendChild(wrapper);

        // Atualiza os valores e reconstrói o 3D em tempo real
        wrapper.querySelector('input').addEventListener('input', (e) => {
            document.getElementById(`${param.id}-val`).innerText = parseFloat(e.target.value).toFixed(1);
            updateGeometry();
        });
    });
}

// Função responsável por calcular e renderizar os corpos 3D
function updateGeometry() {
    const shapeKey = shapeSelect.value;
    const config = shapeConfigs[shapeKey];
    
    let prevRotation = { x: autoRotation.x, y: autoRotation.y, z: 0 };
    if (currentObjectGroup) {
        prevRotation = { x: currentObjectGroup.rotation.x, y: currentObjectGroup.rotation.y, z: currentObjectGroup.rotation.z };
        scene.remove(currentObjectGroup);
    }

    const values = {};
    config.params.forEach(param => {
        values[param.id] = parseFloat(document.getElementById(param.id).value);
    });

    currentObjectGroup = new THREE.Group();
    let geo;
    let mats = materialMain; 

    // Mapeamento das estruturas do Three.js
    switch (shapeKey) {
        case 'cube':
            geo = new THREE.BoxGeometry(values.width, values.height, values.depth);
            mats = [materialMain, materialMain, materialBase, materialBase, materialMain, materialMain];
            break;
        case 'sphere':
            geo = new THREE.SphereGeometry(values.radius, values.segments, Math.round(values.segments/1.5));
            break;
        case 'cylinder':
            geo = new THREE.CylinderGeometry(values.radius, values.radius, values.height, values.segments);
            mats = [materialMain, materialBase, materialBase];
            break;
        case 'cone':
            geo = new THREE.ConeGeometry(values.radius, values.height, values.segments);
            mats = [materialMain, materialBase];
            break;
        case 'pyramid':
            const radBase = values.baseW / Math.sqrt(2);
            geo = new THREE.ConeGeometry(radBase, values.height, 4, 1, false, Math.PI/4);
            mats = [materialMain, materialBase];
            break;
    }

    // Criar a malha com as cores mapeadas
    const mesh = new THREE.Mesh(geo, mats);
    currentObjectGroup.add(mesh);

    // Criar as linhas de contorno (Wireframe de trás)
    const edges = new THREE.EdgesGeometry(geo);
    const lineSegments = new THREE.LineSegments(edges, wireframeMaterial);
    currentObjectGroup.add(lineSegments);

    currentObjectGroup.rotation.set(prevRotation.x, prevRotation.y, prevRotation.z);
    scene.add(currentObjectGroup);
}

// Listener para a mudança do select principal
shapeSelect.addEventListener('change', () => {
    generateControls(shapeSelect.value);
    updateGeometry();
});

// Listener para manter o canvas responsivo quando a janela mudar de tamanho
window.addEventListener('resize', () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

// Inicialização do Aplicativo
generateControls(shapeSelect.value);
updateGeometry();

// Loop de renderização contínua (Animação)
function animate() {
    requestAnimationFrame(animate);
    if (!isDragging && currentObjectGroup) {
        currentObjectGroup.rotation.y += autoRotation.y;
        currentObjectGroup.rotation.x += autoRotation.x;
    }
    renderer.render(scene, camera);
}
animate();