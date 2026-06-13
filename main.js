// ==========================================
// --- CONFIGURAÇÃO DO THREE.JS (Cenário) ---
// ==========================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x020617, 5, 15);

const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(3, 3, 7);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
keyLight.position.set(5, 8, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.3);
fillLight.position.set(-5, -2, -2);
scene.add(fillLight);

const materialMain = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5, metalness: 0.2, flatShading: true });
const materialBase = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.6, metalness: 0.1, flatShading: true });
const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, depthWrite: false });

let currentObjectGroup;

// --- LÓGICA DE INTERAÇÃO (Rotacionar) ---
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let autoRotation = { x: 0.002, y: 0.004 };

const startDrag = (x, y) => { isDragging = true; previousMousePosition = { x, y }; autoRotation = { x: 0, y: 0 }; };
const endDrag = () => { isDragging = false; };
const moveDrag = (x, y) => {
    if (isDragging && currentObjectGroup) {
        const deltaMove = { x: x - previousMousePosition.x, y: y - previousMousePosition.y };
        currentObjectGroup.rotation.y += deltaMove.x * 0.01;
        currentObjectGroup.rotation.x += deltaMove.y * 0.01;
        previousMousePosition = { x, y };
    }
};

container.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
window.addEventListener('mouseup', endDrag);
window.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
container.addEventListener('touchstart', (e) => startDrag(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
window.addEventListener('touchend', endDrag);
window.addEventListener('touchmove', (e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY), { passive: true });


// ==========================================
// --- BANCO DE DADOS E EQUAÇÕES MATEMÁTICAS ---
// ==========================================
const shapeConfigs = {
    cube: {
        name: "Paralelepípedo / Cubo",
        params: [
            { id: 'width', label: 'Largura (a)', value: 2 },
            { id: 'height', label: 'Altura (b)', value: 1.5 },
            { id: 'depth', label: 'Profundidade (c)', value: 1 }
        ],
        // Função que executa o cálculo com os valores digitados pelo usuário
        calculate: (v) => {
            const ab = v.width * v.depth;
            const at = 2 * (v.width * v.height + v.width * v.depth + v.height * v.depth);
            const vol = v.width * v.height * v.depth;
            return `
                <p><strong class="text-sky-400">Área da Base (Ab = a × c):</strong><br> ${v.width} × ${v.depth} = <span class="text-amber-300 font-mono font-bold">${ab.toFixed(2)}</span></p>
                <p><strong class="text-emerald-400">Área Total (At = 2·(ab+ac+bc)):</strong><br> <span class="text-amber-300 font-mono font-bold">${at.toFixed(2)}</span></p>
                <p><strong class="text-white">Volume (V = a × b × c):</strong><br> ${v.width} × ${v.height} × ${v.depth} = <span class="text-amber-300 font-mono font-bold">${vol.toFixed(2)}</span></p>
            `;
        }
    },
    sphere: {
        name: "Esfera",
        params: [
            { id: 'radius', label: 'Raio (r)', value: 1.5 }
        ],
        calculate: (v) => {
            const r = v.radius;
            const area = 4 * Math.PI * Math.pow(r, 2);
            const vol = (4 / 3) * Math.PI * Math.pow(r, 3);
            return `
                <p><strong class="text-emerald-400">Área da Superfície (A = 4 × π × r²):</strong><br> 4 × π × ${r}² = <span class="text-amber-300 font-mono font-bold">${area.toFixed(2)}</span></p>
                <p><strong class="text-white">Volume (V = 4/3 × π × r³):</strong><br> 4/3 × π × ${r}³ = <span class="text-amber-300 font-mono font-bold">${vol.toFixed(2)}</span></p>
            `;
        }
    },
    cylinder: {
        name: "Cilindro Circular Reto",
        params: [
            { id: 'radius', label: 'Raio da Base (r)', value: 1 },
            { id: 'height', label: 'Altura (h)', value: 2.5 }
        ],
        calculate: (v) => {
            const r = v.radius;
            const h = v.height;
            const ab = Math.PI * Math.pow(r, 2);
            const al = 2 * Math.PI * r * h;
            const at = 2 * ab + al;
            const vol = ab * h;
            return `
                <p><strong class="text-sky-400">Área da Base (Ab = π × r²):</strong><br> <span class="text-amber-300 font-mono font-bold">${ab.toFixed(2)}</span></p>
                <p><strong class="text-emerald-400">Área Lateral (Al = 2 × π × r × h):</strong><br> <span class="text-amber-300 font-mono font-bold">${al.toFixed(2)}</span></p>
                <p><strong class="text-emerald-300">Área Total (At = 2×Ab + Al):</strong><br> <span class="text-amber-300 font-mono font-bold">${at.toFixed(2)}</span></p>
                <p><strong class="text-white">Volume (V = Ab × h):</strong><br> <span class="text-amber-300 font-mono font-bold">${vol.toFixed(2)}</span></p>
            `;
        }
    },
    cone: {
        name: "Cone Circular Reto",
        params: [
            { id: 'radius', label: 'Raio da Base (r)', value: 1.2 },
            { id: 'height', label: 'Altura (h)', value: 2.5 }
        ],
        calculate: (v) => {
            const r = v.radius;
            const h = v.height;
            const g = Math.sqrt(Math.pow(r, 2) + Math.pow(h, 2));
            const ab = Math.PI * Math.pow(r, 2);
            const al = Math.PI * r * g;
            const at = ab + al;
            const vol = (1 / 3) * ab * h;
            return `
                <p><strong class="text-sky-400">Área da Base (Ab = π × r²):</strong><br> <span class="text-amber-300 font-mono font-bold">${ab.toFixed(2)}</span></p>
                <p class="text-xs text-slate-400">Geratriz calculada (g = √(r² + h²)): ${g.toFixed(2)}</p>
                <p><strong class="text-emerald-400">Área Lateral (Al = π × r × g):</strong><br> <span class="text-amber-300 font-mono font-bold">${al.toFixed(2)}</span></p>
                <p><strong class="text-white">Volume (V = 1/3 × Ab × h):</strong><br> <span class="text-amber-300 font-mono font-bold">${vol.toFixed(2)}</span></p>
            `;
        }
    },
    pyramid: {
        name: "Pirâmide Quadrangular Reta",
        params: [
            { id: 'baseW', label: 'Lado da Base (l)', value: 2 },
            { id: 'height', label: 'Altura (h)', value: 2.5 }
        ],
        calculate: (v) => {
            const l = v.baseW;
            const h = v.height;
            const ab = l * l;
            const al_apotema = Math.sqrt(Math.pow(h, 2) + Math.pow(l / 2, 2));
            const al = 2 * l * al_apotema;
            const at = ab + al;
            const vol = (1 / 3) * ab * h;
            return `
                <p><strong class="text-sky-400">Área da Base (Ab = l²):</strong><br> ${l}² = <span class="text-amber-300 font-mono font-bold">${ab.toFixed(2)}</span></p>
                <p class="text-xs text-slate-400">Apótema Lateral (al = √(h² + (l/2)²)): ${al_apotema.toFixed(2)}</p>
                <p><strong class="text-emerald-400">Área Lateral (Al = 2 × l × al):</strong><br> <span class="text-amber-300 font-mono font-bold">${al.toFixed(2)}</span></p>
                <p><strong class="text-emerald-300">Área Total (At = Ab + Al):</strong><br> <span class="text-amber-300 font-mono font-bold">${at.toFixed(2)}</span></p>
                <p><strong class="text-white">Volume (V = 1/3 × Ab × h):</strong><br> <span class="text-amber-300 font-mono font-bold">${vol.toFixed(2)}</span></p>
            `;
        }
    }
};

const shapeSelect = document.getElementById('shape-select');
const controlsContainer = document.getElementById('controls-container');
const formulaContainer = document.getElementById('formula-container');

// ==========================================
// --- OPERAÇÕES DE INTERFACE E CÁLCULO ---
// ==========================================

function generateControls(shapeKey) {
    controlsContainer.innerHTML = '';
    const config = shapeConfigs[shapeKey];

    // Cria os inputs numéricos na barra lateral
    config.params.forEach(param => {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-col gap-1';
        wrapper.innerHTML = `
            <label for="${param.id}" class="text-xs font-medium text-slate-400">${param.label}</label>
            <input type="number" id="${param.id}" value="${param.value}" step="0.1" min="0.1" max="10"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
        `;
        controlsContainer.appendChild(wrapper);

        // Dispara a atualização matemática e visual toda vez que o usuário digita ou altera o número
        wrapper.querySelector('input').addEventListener('input', () => {
            updateGeometryAndCalculations();
        });
    });

    updateGeometryAndCalculations();
}

function updateGeometryAndCalculations() {
    const shapeKey = shapeSelect.value;
    const config = shapeConfigs[shapeKey];
    
    // Coleta e valida os valores numéricos digitados pelo usuário
    const values = {};
    let hasInvalidValue = false;
    config.params.forEach(param => {
        const inputEl = document.getElementById(param.id);
        let val = parseFloat(inputEl.value);
        
        // Proteção contra campos vazios, zeros ou números negativos
        if (isNaN(val) || val <= 0) {
            val = 0.1; 
            hasInvalidValue = true;
        }
        values[param.id] = val;
    });

    // 1. ATUALIZA AS FÓRMULAS E EXIBE OS RESULTADOS DO CÁLCULO
    if (hasInvalidValue) {
        formulaContainer.innerHTML = `<h3 class="font-bold text-emerald-300 text-base mb-2">${config.name}</h3><p class="text-rose-400 text-xs">Insira valores maiores que 0 para calcular.</p>`;
    } else {
        formulaContainer.innerHTML = `<h3 class="font-bold text-emerald-300 text-base mb-2">${config.name}</h3>${config.calculate(values)}`;
    }

    // 2. RECONSTRÓI O OBJETO 3D NA TELA
    let prevRotation = { x: autoRotation.x, y: autoRotation.y, z: 0 };
    if (currentObjectGroup) {
        prevRotation = { x: currentObjectGroup.rotation.x, y: currentObjectGroup.rotation.y, z: currentObjectGroup.rotation.z };
        scene.remove(currentObjectGroup);
    }

    currentObjectGroup = new THREE.Group();
    let geo;
    let mats = materialMain; 

    // Limita o tamanho visual máximo no Canvas 3D para não quebrar a tela se o usuário digitar algo gigante como "100"
    const limit = (val) => Math.min(val, 4); 

    switch (shapeKey) {
        case 'cube':
            geo = new THREE.BoxGeometry(limit(values.width), limit(values.height), limit(values.depth));
            mats = [materialMain, materialMain, materialBase, materialBase, materialMain, materialMain];
            break;
        case 'sphere':
            // Resolução fixa em 24 para manter desempenho independente do valor do raio
            geo = new THREE.SphereGeometry(limit(values.radius), 24, 16);
            break;
        case 'cylinder':
            geo = new THREE.CylinderGeometry(limit(values.radius), limit(values.radius), limit(values.height), 32);
            mats = [materialMain, materialBase, materialBase];
            break;
        case 'cone':
            geo = new THREE.ConeGeometry(limit(values.radius), limit(values.height), 24);
            mats = [materialMain, materialBase];
            break;
        case 'pyramid':
            const radBase = limit(values.baseW) / Math.sqrt(2);
            geo = new THREE.ConeGeometry(radBase, limit(values.height), 4, 1, false, Math.PI/4);
            mats = [materialMain, materialBase];
            break;
    }

    const mesh = new THREE.Mesh(geo, mats);
    currentObjectGroup.add(mesh);

    const edges = new THREE.EdgesGeometry(geo);
    const lineSegments = new THREE.LineSegments(edges, wireframeMaterial);
    currentObjectGroup.add(lineSegments);

    currentObjectGroup.rotation.set(prevRotation.x, prevRotation.y, prevRotation.z);
    scene.add(currentObjectGroup);
}

// Evento de troca de Forma Geométrica
shapeSelect.addEventListener('change', () => {
    generateControls(shapeSelect.value);
});

window.addEventListener('resize', () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

// Inicialização
generateControls(shapeSelect.value);

// Loop de animação contínua do motor 3D
function animate() {
    requestAnimationFrame(animate);
    if (!isDragging && currentObjectGroup) {
        currentObjectGroup.rotation.y += autoRotation.y;
        currentObjectGroup.rotation.x += autoRotation.x;
    }
    renderer.render(scene, camera);
}
animate();