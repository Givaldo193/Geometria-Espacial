// ==========================================
// --- CONFIGURAÇÃO DO THREE.JS (Cenário) ---
// ==========================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x020617, 5, 20);

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

// ==========================================
// --- LÓGICA DE INTERAÇÃO E ZOOM ---
// ==========================================
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let autoRotation = { x: 0.002, y: 0.004, z: 0.001 }; 

const MIN_ZOOM = 3;
const MAX_ZOOM = 15;
const zoomSlider = document.getElementById('zoom-slider');

function applyZoom(targetZoom) {
    const zoomVal = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom));
    const direction = new THREE.Vector3().copy(camera.position).normalize();
    camera.position.copy(direction.multiplyScalar(zoomVal));
    if (zoomSlider) {
        zoomSlider.value = zoomVal;
    }
}

container.addEventListener('wheel', (e) => {
    e.preventDefault(); 
    const currentDistance = camera.position.length();
    const zoomFactor = e.deltaY * 0.01; 
    applyZoom(currentDistance + zoomFactor);
}, { passive: false });

if (zoomSlider) {
    zoomSlider.addEventListener('input', (e) => {
        applyZoom(parseFloat(e.target.value));
    });
}

let initialTouchDist = 0; 

const startDrag = (x, y) => { 
    isDragging = true; 
    previousMousePosition = { x, y }; 
    autoRotation = { x: 0, y: 0, z: 0 }; 
};

const endDrag = () => { isDragging = false; initialTouchDist = 0; };

const moveDrag = (x, y) => {
    if (isDragging && currentObjectGroup) {
        const deltaMove = { x: x - previousMousePosition.x, y: y - previousMousePosition.y };
        const deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
                deltaMove.y * 0.01,
                deltaMove.x * 0.01,
                0,
                'XYZ'
            ));
        currentObjectGroup.quaternion.multiplyQuaternions(deltaRotationQuaternion, currentObjectGroup.quaternion);
        previousMousePosition = { x, y };
    }
};

container.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
window.addEventListener('mouseup', endDrag);
window.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));

container.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
        initialTouchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }
}, { passive: false });

window.addEventListener('touchend', endDrag);
container.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
        moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2 && initialTouchDist > 0) {
        const currentDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        const deltaDist = initialTouchDist - currentDist;
        const currentDistance = camera.position.length();
        applyZoom(currentDistance + (deltaDist * 0.02));
        initialTouchDist = currentDist;
    }
}, { passive: false });

// ==========================================
// --- BANCO DE DADOS E EQUAÇÕES MATEMÁTICAS ---
// ==========================================
const shapeConfigs = {
    cube: {
        name: "Paralelepipedo / Cubo",
        params: [
            { id: 'width', label: 'Largura (a)', value: 2 },
            { id: 'height', label: 'Altura (b)', value: 1.5 },
            { id: 'depth', label: 'Profundidade (c)', value: 1 }
        ],
        calculate: (v) => {
            const ab = v.width * v.depth;
            const at = 2 * (v.width * v.height + v.width * v.depth + v.height * v.depth);
            const vol = v.width * v.height * v.depth;
            return `
                <p><strong class="text-sky-400">Area da Base (Ab = a x c):</strong><br> ${v.width} x ${v.depth} = <span class="text-amber-300 font-mono font-bold">${ab.toFixed(2)}</span></p>
                <p><strong class="text-emerald-400">Area Total (At = 2.(ab+ac+bc)):</strong><br> <span class="text-amber-300 font-mono font-bold">${at.toFixed(2)}</span></p>
                <p><strong class="text-white">Volume (V = a x b x c):</strong><br> ${v.width} x ${v.height} x ${v.depth} = <span class="text-amber-300 font-mono font-bold">${vol.toFixed(2)}</span></p>
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
                <p><strong class="text-emerald-400">Area da Superficie (A = 4 x PI x r^2):</strong><br> 4 x PI x ${r}^2 = <span class="text-amber-300 font-mono font-bold">${area.toFixed(2)}</span></p>
                <p><strong class="text-white">Volume (V = 4/3 x PI x r^3):</strong><br> 4/3 x PI x ${r}^3 = <span class="text-amber-300 font-mono font-bold">${vol.toFixed(2)}</span></p>
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
            const r = v.radius; const h = v.height;
            const ab = Math.PI * Math.pow(r, 2); const al = 2 * Math.PI * r * h;
            const at = 2 * ab + al; const vol = ab * h;
            return `
                <p><strong class="text-sky-400">Area da Base (Ab = PI x r^2):</strong><br> <span class="text-amber-300 font-mono font-bold">${ab.toFixed(2)}</span></p>
                <p><strong class="text-emerald-400">Area Lateral (Al = 2 x PI x r x h):</strong><br> <span class="text-amber-300 font-mono font-bold">${al.toFixed(2)}</span></p>
                <p><strong class="text-emerald-300">Area Total (At = 2xAb + Al):</strong><br> <span class="text-amber-300 font-mono font-bold">${at.toFixed(2)}</span></p>
                <p><strong class="text-white">Volume (V = Ab x h):</strong><br> <span class="text-amber-300 font-mono font-bold">${vol.toFixed(2)}</span></p>
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
            const r = v.radius; const h = v.height;
            const g = Math.sqrt(Math.pow(r, 2) + Math.pow(h, 2));
            const ab = Math.PI * Math.pow(r, 2); const al = Math.PI * r * g;
            const vol = (1 / 3) * ab * h;
            return `
                <p><strong class="text-sky-400">Area da Base (Ab = PI x r^2):</strong><br> <span class="text-amber-300 font-mono font-bold">${ab.toFixed(2)}</span></p>
                <p class="text-xs text-slate-400">Geratriz (g = v(r^2 + h^2)): ${g.toFixed(2)}</p>
                <p><strong class="text-emerald-400">Area Lateral (Al = PI x r x g):</strong><br> <span class="text-amber-300 font-mono font-bold">${al.toFixed(2)}</span></p>
                <p><strong class="text-white">Volume (V = 1/3 x Ab x h):</strong><br> <span class="text-amber-300 font-mono font-bold">${vol.toFixed(2)}</span></p>
            `;
        }
    },
    pyramid: {
        name: "Piramide Quadrangular Reta",
        params: [
            { id: 'baseW', label: 'Lado da Base (l)', value: 2 },
            { id: 'height', label: 'Altura (h)', value: 2.5 }
        ],
        calculate: (v) => {
            const l = v.baseW; const h = v.height;
            const ab = l * l; const al_apotema = Math.sqrt(Math.pow(h, 2) + Math.pow(l / 2, 2));
            const al = 2 * l * al_apotema; const vol = (1 / 3) * ab * h;
            return `
                <p><strong class="text-sky-400">Area da Base (Ab = l^2):</strong><br> <span class="text-amber-300 font-mono font-bold">${ab.toFixed(2)}</span></p>
                <p><strong class="text-emerald-400">Area Lateral (Al = 2 x l x ap):</strong><br> <span class="text-amber-300 font-mono font-bold">${al.toFixed(2)}</span></p>
                <p><strong class="text-white">Volume (V = 1/3 x Ab x h):</strong><br> <span class="text-amber-300 font-mono font-bold">${vol.toFixed(2)}</span></p>
            `;
        }
    },
    torus: {
        name: "Toro / Toroide",
        params: [
            { id: 'radius', label: 'Raio Maior (R)', value: 1.4 },
            { id: 'tube', label: 'Raio do Tubo (r)', value: 0.5 }
        ],
        calculate: (v) => {
            const R = v.radius; const r = v.tube;
            const area = 4 * Math.PI * Math.PI * R * r;
            const vol = 2 * Math.PI * Math.PI * R * r * r;
            return `
                <p><strong class="text-emerald-400">Area Superficial (A = 4PI^2.R.r):</strong><br> <span class="text-amber-300 font-mono font-bold">${area.toFixed(2)}</span></p>
                <p><strong class="text-white">Volume (V = 2PI^2.R.r^2):</strong><br> <span class="text-amber-300 font-mono font-bold">${vol.toFixed(2)}</span></p>
            `;
        }
    },
    prism: {
        name: "Prisma Triangular Regular",
        params: [
            { id: 'side', label: 'Aresta da Base (l)', value: 1.8 },
            { id: 'height', label: 'Altura (h)', value: 2.5 }
        ],
        calculate: (v) => {
            const l = v.side; const h = v.height;
            const ab = (Math.sqrt(3) / 4) * l * l;
            const al = 3 * l * h; const vol = ab * h;
            return `
                <p><strong class="text-sky-400">Area da Base (Ab):</strong><br> <span class="text-amber-300 font-mono font-bold">${ab.toFixed(2)}</span></p>
                <p><strong class="text-emerald-400">Area Total (2.Ab + Al):</strong><br> <span class="text-amber-300 font-mono font-bold">${(2*ab + al).toFixed(2)}</span></p>
                <p><strong class="text-white">Volume (V = Ab x h):</strong><br> <span class="text-amber-300 font-mono font-bold">${vol.toFixed(2)}</span></p>
            `;
        }
    },
    octahedron: {
        name: "Octaedro Regular",
        params: [
            { id: 'radius', label: 'Aresta (a)', value: 1.5 }
        ],
        calculate: (v) => {
            const a = v.radius;
            const area = 2 * Math.sqrt(3) * a * a;
            const vol = (Math.sqrt(2) / 3) * Math.pow(a, 3);
            return `
                <p><strong class="text-emerald-400">Area Total (A = 2v3.a^2):</strong><br> <span class="text-amber-300 font-mono font-bold">${area.toFixed(2)}</span></p>
                <p><strong class="text-white">Volume (V = v2/3.a^3):</strong><br> <span class="text-amber-300 font-mono font-bold">${vol.toFixed(2)}</span></p>
            `;
        }
    },
    dodecahedron: {
        name: "Dodecaedro Regular",
        params: [
            { id: 'radius', label: 'Aresta (a)', value: 1.2 }
        ],
        calculate: (v) => {
            const a = v.radius;
            const area = 3 * Math.sqrt(25 + 10 * Math.sqrt(5)) * a * a;
            const vol = ((15 + 7 * Math.sqrt(5)) / 4) * Math.pow(a, 3);
            return `
                <p><strong class="text-emerald-400">Area Total (A = 3v(25+10v5).a^2):</strong><br> <span class="text-amber-300 font-mono font-bold">${area.toFixed(2)}</span></p>
                <p><strong class="text-white">Volume (V = 1/4.(15+7v5).a^3):</strong><br> <span class="text-amber-300 font-mono font-bold">${vol.toFixed(2)}</span></p>
            `;
        }
    },
    icosahedron: {
        name: "Icosaedro Regular",
        params: [
            { id: 'radius', label: 'Aresta (a)', value: 1.3 }
        ],
        calculate: (v) => {
            const a = v.radius;
            const area = 5 * Math.sqrt(3) * a * a;
            const vol = (5 / 12) * (3 + Math.sqrt(5)) * Math.pow(a, 3);
            return `
                <p><strong class="text-emerald-400">Area Total (A = 5v3.a^2):</strong><br> <span class="text-amber-300 font-mono font-bold">${area.toFixed(2)}</span></p>
                <p><strong class="text-white">Volume (V = 5/12(3+v5)a^3):</strong><br> <span class="text-amber-300 font-mono font-bold">${vol.toFixed(2)}</span></p>
            `;
        }
    },
    capsule: {
        name: "Capsula",
        params: [
            { id: 'radius', label: 'Raio (r)', value: 0.8 },
            { id: 'height', label: 'Comprimento Central (h)', value: 1.8 }
        ],
        calculate: (v) => {
            const r = v.radius;
            const h = v.height;
            const area = 2 * Math.PI * r * (2 * r + h);
            const vol = Math.PI * r * r * ((4 / 3) * r + h);
            return `
                <p><strong class="text-emerald-400">Area Externa (A = 2PI.r.(2r+h)):</strong><br> 2 x PI x ${r} x (2 x ${r} + ${h}) = <span class="text-amber-300 font-mono font-bold">${area.toFixed(2)}</span></p>
                <p><strong class="text-white">Volume Total (V = PI.r^2.(4/3.r+h)):</strong><br> PI x ${r}^2 x (4/3 x ${r} + ${h}) = <span class="text-amber-300 font-mono font-bold">${vol.toFixed(2)}</span></p>
            `;
        }
    },
    torusknot: {
        name: "No Toroidal",
        params: [
            { id: 'radius', label: 'Raio Principal (R)', value: 1.2 },
            { id: 'tube', label: 'Raio do Tubo (r)', value: 0.4 }
        ],
        calculate: (v) => {
            const R = v.radius;
            const r = v.tube;
            const area = 4 * Math.PI * Math.PI * R * r;
            const vol = 2 * Math.PI * Math.PI * R * r * r;
            return `
                <p><strong class="text-emerald-400">Area Aproximada (A = 4PI^2.R.r):</strong><br> 4 x PI^2 x ${R} x ${r} = <span class="text-amber-300 font-mono font-bold">${area.toFixed(2)}</span></p>
                <p><strong class="text-white">Volume Aproximado (V = 2PI^2.R.r^2):</strong><br> 2 x PI^2 x ${R} x ${r}^2 = <span class="text-amber-300 font-mono font-bold">${vol.toFixed(2)}</span></p>
            `;
        }
    }
};

const shapeSelect = document.getElementById('shape-select');
const controlsContainer = document.getElementById('controls-container');
const formulaContainer = document.getElementById('formula-container');

function getSafeShapeKey(rawKey) {
    if (!rawKey) return 'cube';
    const lower = rawKey.toLowerCase();
    if (lower === 'torusknot') return 'torusknot';
    return rawKey;
}

function generateControls(rawShapeKey) {
    controlsContainer.innerHTML = '';
    const shapeKey = getSafeShapeKey(rawShapeKey);
    const config = shapeConfigs[shapeKey];
    
    if (!config) {
        formulaContainer.innerHTML = `<p class="text-rose-400 text-xs">Configuracao nao encontrada</p>`;
        return;
    }

    config.params.forEach(param => {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-col gap-1';
        wrapper.innerHTML = `
            <label class="text-xs font-medium text-slate-400">${param.label}</label>
            <input type="number" id="${param.id}" value="${param.value}" step="0.1" min="0.1" max="10"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
        `;
        controlsContainer.appendChild(wrapper);
        wrapper.querySelector('input').addEventListener('input', updateGeometryAndCalculations);
    });
    updateGeometryAndCalculations();
}

function updateGeometryAndCalculations() {
    if (!shapeSelect) return;
    const shapeKey = getSafeShapeKey(shapeSelect.value);
    const config = shapeConfigs[shapeKey];
    if (!config) return;

    const values = {}; let hasInvalidValue = false;

    config.params.forEach(param => {
        const inputEl = controlsContainer.querySelector(`#${param.id}`);
        let val = inputEl ? parseFloat(inputEl.value) : param.value;
        if (isNaN(val) || val <= 0) { val = 0.1; hasInvalidValue = true; }
        values[param.id] = val;
    });

    if (hasInvalidValue) {
        formulaContainer.innerHTML = `<h3 class="font-bold text-emerald-300 text-base mb-2">${config.name}</h3><p class="text-rose-400 text-xs">Valores invalidos.</p>`;
    } else {
        formulaContainer.innerHTML = `<h3 class="font-bold text-emerald-300 text-base mb-2">${config.name}</h3>${config.calculate(values)}`;
    }

    let prevQuaternion = new THREE.Quaternion();
    if (currentObjectGroup) {
        prevQuaternion.copy(currentObjectGroup.quaternion);
        scene.remove(currentObjectGroup);
    } else {
        prevQuaternion.setFromEuler(new THREE.Euler(0.3, 0.5, 0));
    }

    currentObjectGroup = new THREE.Group();
    let geo = null; 
    let mats = materialMain;
    const limit = (val) => Math.min(val, 4); 

    if (shapeKey === 'capsule') {
        const r = limit(values.radius);
        const h = limit(values.height);

        const cylinderGeo = new THREE.CylinderGeometry(r, r, h, 32, 1, true);
        const cylinderMesh = new THREE.Mesh(cylinderGeo, materialMain);
        currentObjectGroup.add(cylinderMesh);

        const topSphereGeo = new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const topSphereMesh = new THREE.Mesh(topSphereGeo, materialBase);
        topSphereMesh.position.y = h / 2;
        currentObjectGroup.add(topSphereMesh);

        const bottomSphereGeo = new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
        const bottomSphereMesh = new THREE.Mesh(bottomSphereGeo, materialBase);
        bottomSphereMesh.position.y = -h / 2;
        currentObjectGroup.add(bottomSphereMesh);

        const cylinderEdges = new THREE.EdgesGeometry(cylinderGeo);
        currentObjectGroup.add(new THREE.LineSegments(cylinderEdges, wireframeMaterial));
        
        const topEdges = new THREE.EdgesGeometry(topSphereGeo);
        const topLines = new THREE.LineSegments(topEdges, wireframeMaterial);
        topLines.position.y = h / 2;
        currentObjectGroup.add(topLines);

        const bottomEdges = new THREE.EdgesGeometry(bottomSphereGeo);
        const bottomLines = new THREE.LineSegments(bottomEdges, wireframeMaterial);
        bottomLines.position.y = -h / 2;
        currentObjectGroup.add(bottomLines);
    } else {
        switch (shapeKey) {
            case 'cube':
                geo = new THREE.BoxGeometry(limit(values.width), limit(values.height), limit(values.depth));
                mats = [materialMain, materialMain, materialBase, materialBase, materialMain, materialMain];
                break;
            case 'sphere':
                geo = new THREE.SphereGeometry(limit(values.radius), 24, 16);
                break;
            case 'cylinder':
                geo = new THREE.CylinderGeometry(limit(values.radius), limit(values.radius), limit(values.height), 32);
                mats = [materialMain, materialBase, materialBase];
                break;
            case 'cone':
            // 1. Cria o corpo do cone (aberto embaixo)
            const coneBodyGeo = new THREE.ConeGeometry(limit(values.radius), limit(values.height), 24, 1, true);
            const coneBody = new THREE.Mesh(coneBodyGeo, materialMain);
            currentObjectGroup.add(coneBody);

            // 2. Cria a base circular separada
            const coneBaseGeo = new THREE.CircleGeometry(limit(values.radius), 24);
            const coneBase = new THREE.Mesh(coneBaseGeo, materialBase);
            coneBase.rotation.x = Math.PI / 2; 
            coneBase.position.y = -limit(values.height) / 2; 
            currentObjectGroup.add(coneBase);

            // 3. Cria as linhas brancas extraindo direto das formas criadas acima
            const coneEdges = new THREE.EdgesGeometry(coneBodyGeo);
            const coneLineSegments = new THREE.LineSegments(coneEdges, wireframeMaterial);
            currentObjectGroup.add(coneLineSegments);

            const coneBaseEdges = new THREE.EdgesGeometry(coneBaseGeo);
            const coneBaseLines = new THREE.LineSegments(coneBaseEdges, wireframeMaterial);
            coneBaseLines.rotation.x = Math.PI / 2;
            coneBaseLines.position.y = -limit(values.height) / 2;
            currentObjectGroup.add(coneBaseLines);

            geo = null; // Anula para não duplicar no código abaixo do switch
            break;

        case 'pyramid':
            // 1. Cria o corpo da pirâmide (aberto embaixo)
            const pyrBodyGeo = new THREE.ConeGeometry(limit(values.baseW) / Math.sqrt(2), limit(values.height), 4, 1, true, Math.PI/4);
            const pyrBody = new THREE.Mesh(pyrBodyGeo, materialMain);
            currentObjectGroup.add(pyrBody);

            // 2. Cria a base quadrada separada
            const pyrBaseGeo = new THREE.PlaneGeometry(limit(values.baseW), limit(values.baseW));
            const pyrBase = new THREE.Mesh(pyrBaseGeo, materialBase);
            pyrBase.rotation.x = Math.PI / 2; 
            pyrBase.position.y = -limit(values.height) / 2; 
            currentObjectGroup.add(pyrBase);

            // 3. Cria as linhas brancas extraindo direto das formas criadas acima
            const pyrEdges = new THREE.EdgesGeometry(pyrBodyGeo);
            const pyrLineSegments = new THREE.LineSegments(pyrEdges, wireframeMaterial);
            currentObjectGroup.add(pyrLineSegments);

            const pyrBaseEdges = new THREE.EdgesGeometry(pyrBaseGeo);
            const pyrBaseLines = new THREE.LineSegments(pyrBaseEdges, wireframeMaterial);
            pyrBaseLines.rotation.x = Math.PI / 2;
            pyrBaseLines.position.y = -limit(values.height) / 2;
            currentObjectGroup.add(pyrBaseLines);

            geo = null; // Anula para não duplicar no código abaixo do switch
            break;
            case 'torus':
                geo = new THREE.TorusGeometry(limit(values.radius), limit(values.tube), 12, 48);
                break;
            case 'prism':
                geo = new THREE.CylinderGeometry(limit(values.side)/Math.sqrt(3), limit(values.side)/Math.sqrt(3), limit(values.height), 3);
                mats = [materialMain, materialBase, materialBase];
                break;
            case 'octahedron':
                geo = new THREE.OctahedronGeometry(limit(values.radius), 0);
                break;
            case 'dodecahedron':
                geo = new THREE.DodecahedronGeometry(limit(values.radius), 0);
                break;
            case 'icosahedron':
                geo = new THREE.IcosahedronGeometry(limit(values.radius), 0);
                break;
            case 'torusknot':
                geo = new THREE.TorusKnotGeometry(limit(values.radius), limit(values.tube), 64, 8, 2, 3);
                break;
        }

       if (shapeKey !== 'capsule' && geo) {
            const mesh = new THREE.Mesh(geo, mats);
            currentObjectGroup.add(mesh);

            if (shapeKey !== "torusknot") {
                const edges = new THREE.EdgesGeometry(geo);
                const lineSegments = new THREE.LineSegments(edges, wireframeMaterial);
                currentObjectGroup.add(lineSegments);
            }
        }
    }

    currentObjectGroup.quaternion.copy(prevQuaternion);
    scene.add(currentObjectGroup);
}

if (shapeSelect) {
    shapeSelect.addEventListener('change', () => generateControls(shapeSelect.value));
    generateControls(shapeSelect.value);
}

window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

function animate() {
    requestAnimationFrame(animate);
    if (!isDragging && currentObjectGroup) {
        currentObjectGroup.rotation.x += autoRotation.x;
        currentObjectGroup.rotation.y += autoRotation.y;
        currentObjectGroup.rotation.z += autoRotation.z;
    }
    renderer.render(scene, camera);
}
animate();