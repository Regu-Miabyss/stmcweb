document.addEventListener('DOMContentLoaded', () => {
  if (typeof THREE === 'undefined') {
    console.warn("Three.js not loaded.");
    return;
  }

  const RENDER_SIZE = 64;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  renderer.setSize(RENDER_SIZE * 2, RENDER_SIZE * 2); 
  renderer.setPixelRatio(1);

  const loader = new THREE.TextureLoader();
  const models = {};

  function setPixelated(texture) {
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
  }

  function getSubMat(tex, tw, th, x, y, w, h) {
    const t = tex.clone();
    t.needsUpdate = true;
    t.repeat.set(w / tw, h / th);
    t.offset.set(x / tw, 1 - (y + h) / th);
    return new THREE.MeshLambertMaterial({ map: t });
  }

  function buildBoxPart(tex, tw, th, config) {
    const getFace = (face) => face ? getSubMat(tex, tw, th, face[0], face[1], face[2], face[3]) : new THREE.MeshBasicMaterial({color:0xff0000, transparent: true, opacity: 0});
    const mats = [
      getFace(config.right), getFace(config.left),
      getFace(config.top), getFace(config.bottom),
      getFace(config.front), getFace(config.back)
    ];
    const geo = new THREE.BoxGeometry(config.w, config.h, config.d);
    const mesh = new THREE.Mesh(geo, mats);
    if (config.x || config.y || config.z) mesh.position.set(config.x, config.y, config.z);
    return mesh;
  }

  async function buildBlock(path, size = 16) {
    const tex = setPixelated(await loader.loadAsync(path));
    const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.5 });
    return new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mat);
  }

  
  async function buildEndPortal(top, side, bottom) {
    const tTop = setPixelated(await loader.loadAsync(top));
    const tSide = setPixelated(await loader.loadAsync(side));
    const tBottom = setPixelated(await loader.loadAsync(bottom));
    const matTop = new THREE.MeshLambertMaterial({ map: tTop });
    const matBottom = new THREE.MeshLambertMaterial({ map: tBottom });
    
    const sideT = tSide.clone();
    sideT.needsUpdate = true;
    sideT.repeat.set(1, 13/16);
    sideT.offset.set(0, 0);
    const matSide = new THREE.MeshLambertMaterial({ map: sideT, transparent: true, alphaTest: 0.5 });
    
    const mats = [matSide, matSide, matTop, matBottom, matSide, matSide];
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(16, 13, 16), mats);
    mesh.position.y = -1.5;
    return mesh;
  }

  async function buildMultiBlock(top, side, bottom) {
    const tTop = setPixelated(await loader.loadAsync(top));
    const tSide = setPixelated(await loader.loadAsync(side));
    const tBottom = setPixelated(await loader.loadAsync(bottom));
    const matTop = new THREE.MeshLambertMaterial({ map: tTop });
    const matSide = new THREE.MeshLambertMaterial({ map: tSide, transparent: true, alphaTest: 0.5 });
    const matBottom = new THREE.MeshLambertMaterial({ map: tBottom });
    const mats = [matSide, matSide, matTop, matBottom, matSide, matSide];
    return new THREE.Mesh(new THREE.BoxGeometry(16, 16, 16), mats);
  }

  async function buildCross(path) {
    const tex = setPixelated(await loader.loadAsync(path));
    const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const geo1 = new THREE.PlaneGeometry(16, 16);
    const m1 = new THREE.Mesh(geo1, mat);
    const m2 = m1.clone();
    m2.rotation.y = Math.PI / 2;
    const group = new THREE.Group();
    group.add(m1, m2);
    return group;
  }

  function buildVoxelItem(path) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = path;
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height).data;
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        let count = 0;
        for (let i = 3; i < data.length; i += 4) { if (data[i] > 128) count++; }
        const instanced = new THREE.InstancedMesh(geo, mat, count);
        let idx = 0;
        const dummy = new THREE.Object3D();
        const color = new THREE.Color();
        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const i = (y * img.width + x) * 4;
            if (data[i+3] > 128) {
              dummy.position.set(x - img.width/2 + 0.5, -(y - img.height/2 + 0.5), 0);
              dummy.updateMatrix();
              instanced.setMatrixAt(idx, dummy.matrix);
              color.setRGB(data[i]/255, data[i+1]/255, data[i+2]/255);
              instanced.setColorAt(idx, color);
              idx++;
            }
          }
        }
        resolve(instanced);
      };
    });
  }

  async function buildChest(path) {
    const tex = setPixelated(await loader.loadAsync(path));
    const group = new THREE.Group();
    group.add(buildBoxPart(tex, 64, 64, {
      w: 14, h: 10, d: 14, y: -2,
      right: [0, 19, 14, 10], left: [28, 19, 14, 10],
      top: [14, 19, 14, 14], bottom: [28, 19, 14, 14],
      front: [14, 33, 14, 10], back: [42, 33, 14, 10]
    }));
    group.add(buildBoxPart(tex, 64, 64, {
      w: 14, h: 5, d: 14, y: 5.5,
      right: [0, 0, 14, 5], left: [28, 0, 14, 5],
      top: [14, 0, 14, 14], bottom: [28, 0, 14, 14],
      front: [14, 14, 14, 5], back: [42, 14, 14, 5]
    }));
    return group;
  }
  
  async function buildBed(path) {
    const tex = setPixelated(await loader.loadAsync(path));
    const group = new THREE.Group();
    group.add(buildBoxPart(tex, 64, 64, {
      w: 16, h: 6, d: 32, y: 3,
      right: [0, 22, 16, 6], left: [0, 22, 16, 6],
      top: [6, 6, 16, 16], bottom: [6, 28, 16, 16],
      front: [22, 22, 16, 6], back: [22, 22, 16, 6]
    }));
    return group;
  }

  async function buildCat(path) {
    const tex = setPixelated(await loader.loadAsync(path));
    const group = new THREE.Group();
    group.add(buildBoxPart(tex, 64, 64, {
      w: 5, h: 4, d: 5, y: 6, z: 6,
      right: [0, 0, 5, 4], left: [10, 0, 5, 4],
      top: [5, 0, 5, 5], bottom: [10, 0, 5, 5],
      front: [5, 5, 5, 4], back: [15, 5, 5, 4]
    }));
    group.add(buildBoxPart(tex, 64, 64, {
      w: 4, h: 6, d: 16, y: 0, z: -2,
      right: [20, 0, 4, 16], left: [32, 0, 4, 16],
      top: [24, 0, 4, 6], bottom: [28, 0, 4, 6],
      front: [24, 6, 4, 16], back: [36, 6, 4, 16]
    }));
    return group;
  }

  async function buildTrident(path) {
    const tex = setPixelated(await loader.loadAsync(path));
    const group = new THREE.Group();
    group.add(buildBoxPart(tex, 32, 32, {
      w: 1, h: 22, d: 1,
      right: [0, 0, 1, 22], left: [0, 0, 1, 22],
      top: [0, 0, 1, 1], bottom: [0, 0, 1, 1],
      front: [0, 0, 1, 22], back: [0, 0, 1, 22]
    }));
    return group;
  }

  document.querySelectorAll('.card-canvas').forEach(container => {
    const type = container.dataset.model;
    const canvas = document.createElement('canvas');
    canvas.width = RENDER_SIZE * 2;
    canvas.height = RENDER_SIZE * 2;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    
    const card = container.closest('.card');
    card.addEventListener('mouseenter', () => models[type].isHovered = true);
    card.addEventListener('mouseleave', () => {
      models[type].isHovered = false;
      models[type].mouseX = 0;
      models[type].mouseY = 0;
    });
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      models[type].mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      models[type].mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    });

    let isItem = false;
    switch(type) {
      case 'chest': case 'door': case 'sword': case 'lead': 
      case 'clock': case 'emerald': case 'melon': case 'trim':
      case 'lantern': case 'axe': case 'elytra': case 'night_vision': case 'head': case 'title':
        isItem = true;
        break;
    }

    const scene = new THREE.Scene();
    let camSize = 12;
    
    const camera = new THREE.OrthographicCamera(-camSize, camSize, camSize, -camSize, 0.1, 100);
    if (isItem) {
      camera.position.set(0, 0, 20);
    } else {
      camera.position.set(15, 6, 20); 
    }
    camera.lookAt(0, 0, 0);
    
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);
    
    const obj = { scene, camera, ctx, canvas, isHovered: false, mouseX: 0, mouseY: 0, baseRotY: isItem ? 0 : Math.PI / 4, baseRotX: 0, mesh: null };
    models[type] = obj;
    
    let meshPromise;
    switch(type) {
      case 'gold_block': meshPromise = buildBlock('images/models/gold_block.png'); break;
      case 'end_portal': meshPromise = buildEndPortal('images/models/end_portal_top.png', 'images/models/end_portal_side.png', 'images/models/end_portal_bottom.png'); break;
      case 'sapling': meshPromise = buildCross('images/models/sapling.png'); break;
      case 'lantern': meshPromise = buildVoxelItem('images/models/lantern.png'); break;
      case 'axe': meshPromise = buildVoxelItem('images/models/axe.png'); break;
      case 'elytra': meshPromise = buildVoxelItem('images/models/elytra.png'); break;
      case 'night_vision': meshPromise = buildVoxelItem('images/models/night_vision.png'); break;
      case 'head': meshPromise = buildVoxelItem('images/models/teleport_to_player.png'); break;
      case 'title': meshPromise = buildVoxelItem('images/models/nether_star.png'); break;
      case 'elevator': meshPromise = buildBlock('images/models/iron_block.png'); break;
      case 'painting': meshPromise = buildBlock('images/models/painting.png', 16).then(m => { m.scale.z = 0.05; return m; }); break;
      case 'chest': meshPromise = buildVoxelItem('images/models/chest.png'); break;
      case 'door': meshPromise = buildVoxelItem('images/models/door.png'); break;
      case 'sword': meshPromise = buildVoxelItem('images/models/sword.png'); break;
      case 'lead': meshPromise = buildVoxelItem('images/models/lead.png'); break;
      case 'clock': meshPromise = buildVoxelItem('images/models/clock.png'); break;
      case 'emerald': meshPromise = buildVoxelItem('images/models/emerald.png'); break;
      case 'melon': meshPromise = buildVoxelItem('images/models/melon.png'); break;
      case 'trim': meshPromise = buildVoxelItem('images/models/trim.png'); break;
    }
    
    if (meshPromise) {
      meshPromise.then(mesh => {
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        mesh.position.sub(center);
        
        const group = new THREE.Group();
        group.add(mesh);
        group.rotation.y = obj.baseRotY;
        group.rotation.x = obj.baseRotX;
        
        scene.add(group);
        obj.mesh = group;
        renderSingle(obj);
      }).catch(err => console.error("Error building model", type, err));
    }
  });

  function animate() {
    requestAnimationFrame(animate);
    for (const key in models) {
      const obj = models[key];
      if (!obj.mesh) continue;
      
      let changed = false;
      const targetRotY = obj.isHovered ? obj.baseRotY + obj.mouseX * 0.8 : obj.baseRotY;
      const targetRotX = obj.isHovered ? obj.baseRotX + obj.mouseY * 0.8 : obj.baseRotX;
      
      const diffY = targetRotY - obj.mesh.rotation.y;
      const diffX = targetRotX - obj.mesh.rotation.x;
      
      if (Math.abs(diffY) > 0.01 || Math.abs(diffX) > 0.01) {
        obj.mesh.rotation.y += diffY * 0.15;
        obj.mesh.rotation.x += diffX * 0.15;
        changed = true;
      } else if (obj.mesh.rotation.y !== targetRotY || obj.mesh.rotation.x !== targetRotX) {
        obj.mesh.rotation.y = targetRotY;
        obj.mesh.rotation.x = targetRotX;
        changed = true;
      }
      
      if (changed) renderSingle(obj);
    }
  }
  
  function renderSingle(obj) {
    renderer.render(obj.scene, obj.camera);
    obj.ctx.clearRect(0, 0, RENDER_SIZE * 2, RENDER_SIZE * 2);
    obj.ctx.drawImage(renderer.domElement, 0, 0);
  }
  animate();
});
