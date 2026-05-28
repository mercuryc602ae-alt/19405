/* script.js - 3D图片画廊逻辑 */

// 项目文件夹映射（前10个封面对应的项目内容）
const PROJECT_FOLDERS = {
    1: '01-品牌设计',
    2: '02-平面设计',
    3: '03-字体设计',
    4: '04-海报设计',
    5: '05-动态设计',
    6: '06-详情页设计',
    7: '07-UI设计',
    8: '08-插画设计',
    9: '09-包装设计',
    10: '10-VI设计'
};

// 数据管理类
class ToolsDataManager {
    constructor() {
        this.tools = [];
        this.initializeTools();
    }

    normalizeTool(tool, fallbackId) {
        const normalizedId = tool.id ?? fallbackId;
        let normalizedImage = tool.imageUrl || '';
        
        // 路径清理
        normalizedImage = normalizedImage
            .replace('/protected/FAVORITES/image/', '/images/')
            .replace('/src/images/', '/images/')
            .replace('/src/assets/images/tools/', '/images/')
            .replace('/protected/FAVORITES/', '/');
            
        // 如果不是以/或者http开头，且不包含images，则补全路径
        if (!normalizedImage.startsWith('/') && !normalizedImage.startsWith('http') && !normalizedImage.includes('images/')) {
            normalizedImage = 'images/' + normalizedImage;
        } else if (normalizedImage.startsWith('/')) {
            normalizedImage = normalizedImage.substring(1); // 转为相对路径，增加兼容性
        }
            
        return {
            id: normalizedId,
            imageUrl: normalizedImage || `images/${String(normalizedId).padStart(3, '0')}.png`,
            title: tool.title || `设计工具 ${normalizedId}`,
            description: tool.description || '',
            sortIndex: tool.sortIndex ?? normalizedId
        };
    }
    
    initializeTools() {
        // 这里放置所有的工具数据
        const baseTools = [
            {
                title: "文字风格化网站",
                imageUrl: "images/001.png"
            },
            {
                title: "像素绘画网站",
                imageUrl: "images/002.png"
            },
            {
                title: "可变字体工具",
                imageUrl: "images/003.png"
            },
            {
                title: "声音动态字体网站",
                imageUrl: "images/004.png"
            },
            {
                title: "动态背景网站",
                imageUrl: "images/005.png"
            },
            {
                title: "动态图片生成工具",
                imageUrl: "images/006.png"
            },
            {
                title: "视频实时转换动态图形",
                imageUrl: "images/007.png"
            },
            {
                title: "插画&字体多风格笔刷工具",
                imageUrl: "images/008.png"
            },
            {
                title: "图片转图案工具",
                imageUrl: "images/009.png"
            },
            {
                title: "动态字体工具",
                imageUrl: "images/010.png"
            }
            // ... 可以根据需要添加更多
        ];

        // 尝试加载更多数据
        this.tools = baseTools.map((t, i) => this.normalizeTool(t, i + 1));
        
        // 如果有更多图片，自动生成工具对象 (基于 images/ 目录下的 011-120.png)
        for (let i = 11; i <= 120; i++) {
            const id = i;
            this.tools.push(this.getDefaultTool(id));
        }

        console.log(`📊 工具数据初始化完成，共 ${this.tools.length} 个工具`);
    }
    
    getToolById(id) {
        return this.tools.find(tool => tool.id === id) || this.getDefaultTool(id);
    }
    
    getDefaultTool(id) {
        return {
            id,
            title: `设计工具 ${id}`,
            description: "",
            imageUrl: `images/${String(id).padStart(3, '0')}.png`,
            sortIndex: id
        };
    }
    
    getAllTools() {
        return this.tools;
    }

    getProjectFolder(id) {
        return PROJECT_FOLDERS[id] || null;
    }

    hasProjectFolder(id) {
        return id in PROJECT_FOLDERS;
    }

    getProjectFolderName(id) {
        const folder = PROJECT_FOLDERS[id];
        if (!folder) return null;
        return folder.replace(/^\d+-/, '');
    }
}

// 弹窗管理类
class ImageModalManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.isVisible = false;
        this.currentTool = null;
        this.modal = null;
        this.projectImages = [];
        this.currentImageIndex = 0;
        this.projectsConfig = null;
        this.viewMode = 'preview';
        this.createModal();
        this.bindEvents();
        this.loadProjectsConfig();
    }

    async loadProjectsConfig() {
        try {
            const response = await fetch('projects.json');
            if (response.ok) {
                this.projectsConfig = await response.json();
            }
        } catch (e) {
            console.log('📋 未找到项目配置文件');
        }
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'image-modal';
        this.modal.id = 'imageModal';

        const icons = {
            close: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
            prev: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
            next: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`
        };

        this.modal.innerHTML = `
            <div class="modal-preview-mode">
                <div class="modal-content simple gallery-mode">
                    <button class="modal-close" aria-label="关闭">${icons.close}</button>
                    <button class="gallery-nav prev" aria-label="上一张">${icons.prev}</button>
                    <div class="modal-image-wrapper">
                        <img alt="项目图片">
                        <video muted loop playsinline style="display:none;"></video>
                    </div>
                    <button class="gallery-nav next" aria-label="下一张">${icons.next}</button>
                    <div class="modal-title-bar">
                        <span class="modal-title">项目名称</span>
                        <span class="image-counter">1 / 10</span>
                    </div>
                </div>
                <div class="scroll-hint">
                    <span>↓ 滚动查看更多</span>
                </div>
            </div>
            <div class="modal-detail-mode" style="display:none;">
                <div class="detail-container">
                    <button class="modal-close detail-close" aria-label="关闭">${icons.close}</button>
                    <div class="detail-sidebar">
                        <div class="sidebar-header">
                            <span class="project-title">项目名称</span>
                        </div>
                        <div class="thumbnail-list"></div>
                    </div>
                    <div class="detail-main"></div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
    }

    bindEvents() {
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal || e.target.classList.contains('modal-preview-mode') || e.target.classList.contains('modal-detail-mode')) {
                this.hide();
            }
        });

        const closeBtns = this.modal.querySelectorAll('.modal-close');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hide();
            });
        });

        const prevBtn = this.modal.querySelector('.gallery-nav.prev');
        const nextBtn = this.modal.querySelector('.gallery-nav.next');

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showPrevImage();
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showNextImage();
        });

        this.modal.addEventListener('wheel', (e) => {
            if (!this.isVisible) return;
            if (this.viewMode === 'preview' && e.deltaY > 0 && this.projectImages.length > 1) {
                e.preventDefault();
                this.switchToDetailMode();
            }
        }, { passive: false });

        document.addEventListener('keydown', (e) => {
            if (!this.isVisible) return;
            if (e.key === 'Escape') {
                if (this.viewMode === 'detail') this.switchToPreviewMode();
                else this.hide();
            } else if (e.key === 'ArrowLeft') this.showPrevImage();
            else if (e.key === 'ArrowRight') this.showNextImage();
        });
    }

    async show(imageObj) {
        const toolId = imageObj.id + 1;
        const tool = this.dataManager.getToolById(toolId);

        this.currentTool = tool;
        this.isVisible = true;
        this.currentImageIndex = 0;
        this.viewMode = 'preview';

        if (this.dataManager.hasProjectFolder(toolId)) {
            const folderName = this.dataManager.getProjectFolder(toolId);
            const projectName = this.dataManager.getProjectFolderName(toolId);
            this.modal.querySelector('.modal-title').textContent = projectName;
            this.modal.querySelector('.project-title').textContent = projectName;
            await this.loadProjectImages(folderName);
        } else {
            this.projectImages = [{ src: imageObj.img.src, isVideo: false }];
            this.modal.querySelector('.modal-title').textContent = tool.title;
            this.modal.querySelector('.project-title').textContent = tool.title;
        }

        const scrollHint = this.modal.querySelector('.scroll-hint');
        scrollHint.style.display = this.projectImages.length > 1 ? 'block' : 'none';

        this.displayCurrentImage();
        this.updateNavButtons();

        this.modal.classList.add('visible');
        document.body.classList.add('modal-open');
        this.modal.querySelector('.modal-preview-mode').style.display = 'flex';
        this.modal.querySelector('.modal-detail-mode').style.display = 'none';

        requestAnimationFrame(() => this.modal.classList.add('animate-in'));
    }

    async loadProjectImages(folderName) {
        this.projectImages = [];
        const basePath = `images/${folderName}/`;

        if (this.projectsConfig && this.projectsConfig[folderName]) {
            const files = this.projectsConfig[folderName];
            for (const file of files) {
                this.projectImages.push({ src: basePath + file.name, isVideo: file.isVideo });
            }
            return;
        }

        // 备选方案：尝试加载 01-10.png
        for (let i = 1; i <= 10; i++) {
            const num = String(i).padStart(2, '0');
            const imgPath = `${basePath}${num}.png`;
            try {
                const exists = await this.checkMediaExists(imgPath);
                if (exists) this.projectImages.push({ src: imgPath, isVideo: false });
                else break;
            } catch(e) { break; }
        }

        if (this.projectImages.length === 0) {
            this.projectImages = [{ src: 'placeholder', isVideo: false }];
        }
    }

    checkMediaExists(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = src;
        });
    }

    switchToDetailMode() {
        if (this.projectImages.length <= 1) return;
        this.viewMode = 'detail';
        this.modal.querySelector('.modal-preview-mode').style.display = 'none';
        this.modal.querySelector('.modal-detail-mode').style.display = 'flex';
        this.generateThumbnails();
        this.renderLongGallery();
    }

    renderLongGallery() {
        const container = this.modal.querySelector('.detail-main');
        container.innerHTML = '';
        container.onscroll = () => this.handleDetailScroll();
        container.style.scrollSnapType = 'y mandatory';

        this.projectImages.forEach((item, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'detail-item-wrapper';
            wrapper.id = `detail-item-${index}`;
            wrapper.style.scrollSnapAlign = 'start';

            if (item.isVideo) {
                const video = document.createElement('video');
                video.src = item.src; video.muted = true; video.loop = true; video.playsInline = true; video.controls = true;
                wrapper.appendChild(video);
                if (index === 0) video.play();
            } else if (item.src !== 'placeholder') {
                const img = document.createElement('img');
                img.src = item.src;
                wrapper.appendChild(img);
            }
            container.appendChild(wrapper);
        });
    }

    handleDetailScroll() {
        const container = this.modal.querySelector('.detail-main');
        const items = container.querySelectorAll('.detail-item-wrapper');
        const containerTop = container.getBoundingClientRect().top;
        let activeIndex = 0, minDistance = Infinity;

        items.forEach((item, index) => {
            const rect = item.getBoundingClientRect();
            const distance = Math.abs(rect.top - containerTop);
            if (distance < minDistance) { minDistance = distance; activeIndex = index; }
        });

        if (this.currentImageIndex !== activeIndex) {
            this.currentImageIndex = activeIndex;
            this.updateThumbnailSelection();
        }
    }

    generateThumbnails() {
        const container = this.modal.querySelector('.thumbnail-list');
        container.innerHTML = '';
        this.projectImages.forEach((item, index) => {
            const thumb = document.createElement('div');
            thumb.className = 'thumbnail-item' + (index === this.currentImageIndex ? ' active' : '');
            const imgContainer = document.createElement('div');
            imgContainer.className = 'thumb-img-container';
            if (item.isVideo) {
                const badge = document.createElement('span');
                badge.className = 'video-badge'; badge.textContent = '▶';
                thumb.appendChild(badge);
            } else if (item.src !== 'placeholder') {
                const img = document.createElement('img');
                img.src = item.src; imgContainer.appendChild(img);
            }
            thumb.appendChild(imgContainer);
            thumb.addEventListener('click', () => {
                this.currentImageIndex = index;
                this.updateThumbnailSelection();
                const targetItem = this.modal.querySelector(`#detail-item-${index}`);
                if (targetItem) targetItem.scrollIntoView({ behavior: 'smooth' });
            });
            container.appendChild(thumb);
        });
    }

    updateThumbnailSelection() {
        const thumbs = this.modal.querySelectorAll('.thumbnail-item');
        thumbs.forEach((thumb, index) => thumb.classList.toggle('active', index === this.currentImageIndex));
    }

    displayCurrentImage() {
        const img = this.modal.querySelector('.modal-image-wrapper img');
        const video = this.modal.querySelector('.modal-image-wrapper video');
        const counter = this.modal.querySelector('.image-counter');
        const wrapper = this.modal.querySelector('.modal-image-wrapper');

        video.pause(); video.src = '';

        if (this.projectImages.length === 0 || this.projectImages[0].src === 'placeholder') {
            img.style.display = 'none'; video.style.display = 'none';
            counter.textContent = '0 / 0';
        } else {
            const current = this.projectImages[this.currentImageIndex];
            if (current.isVideo) {
                img.style.display = 'none'; video.style.display = 'block';
                video.src = current.src; video.play();
            } else {
                video.style.display = 'none'; img.style.display = 'block';
                img.src = current.src;
            }
            counter.textContent = `${this.currentImageIndex + 1} / ${this.projectImages.length}`;
        }
        this.updateNavButtons();
    }

    updateNavButtons() {
        const prevBtn = this.modal.querySelector('.gallery-nav.prev');
        const nextBtn = this.modal.querySelector('.gallery-nav.next');
        if (this.projectImages.length <= 1) {
            prevBtn.style.display = 'none'; nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex'; nextBtn.style.display = 'flex';
            prevBtn.disabled = this.currentImageIndex === 0;
            nextBtn.disabled = this.currentImageIndex === this.projectImages.length - 1;
        }
    }

    showPrevImage() {
        if (this.currentImageIndex > 0) {
            this.currentImageIndex--;
            this.displayCurrentImage();
        }
    }

    showNextImage() {
        if (this.currentImageIndex < this.projectImages.length - 1) {
            this.currentImageIndex++;
            this.displayCurrentImage();
        }
    }

    hide() {
        this.isVisible = false;
        this.modal.classList.remove('animate-in');
        this.modal.classList.add('animate-out');
        setTimeout(() => {
            this.modal.classList.remove('visible', 'animate-out');
            document.body.classList.remove('modal-open');
        }, 300);
    }

    isModalVisible() { return this.isVisible; }
}

// 3D 画廊主类
class ImageGallery3D {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.imageMeshes = [];
        this.camera.position.set(0, -10.6, 20.32);
        
        this.gridSettings = { columns: 5, horizontalSpacing: 13.33, verticalSpacing: 14.66 };
        this.gridScrollTarget = -1.6;
        this.gridScrollCurrent = -1.6;
        this.gridZoomTarget = 1.6;
        this.gridZoomCurrent = 1.6;
        this.gridPanTarget = 0;
        this.gridPanCurrent = 0;
        
        this.dataManager = new ToolsDataManager();
        this.modalManager = new ImageModalManager(this.dataManager);
        
        this.initializeThreeJS();
        this.loadImages();
        this.bindEvents();
        this.initGuide();
        this.animate();
    }

    initializeThreeJS() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0xf0f2f5, 1);
        document.body.appendChild(this.renderer.domElement);
        this.renderer.domElement.id = 'canvas';
        
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
        directionalLight.position.set(0, 0, 50);
        this.scene.add(directionalLight);
    }

    async loadImages() {
        const tools = this.dataManager.getAllTools();
        const textures = [];
        const loader = new THREE.TextureLoader();
        
        for (const tool of tools) {
            try {
                const texture = await new Promise((res, rej) => {
                    loader.load(tool.imageUrl, t => {
                        t.minFilter = THREE.LinearFilter;
                        res(t);
                    }, undefined, rej);
                });
                texture.imageId = tool.id;
                textures.push(texture);
            } catch(e) {}
        }
        
        this.createLayout(textures);
        const loading = document.getElementById('loading');
        if(loading) loading.style.display = 'none';
    }

    createLayout(textures) {
        const { columns, horizontalSpacing, verticalSpacing } = this.gridSettings;
        const gridWidth = (columns - 1) * horizontalSpacing;
        const startX = -gridWidth / 2;

        textures.forEach((texture, index) => {
            const row = Math.floor(index / columns);
            const col = index % columns;
            const aspectRatio = texture.image.width / texture.image.height;
            const baseSize = 8;
            const geometry = new THREE.PlaneGeometry(baseSize * Math.max(aspectRatio, 1), baseSize * Math.max(1/aspectRatio, 1));
            const material = new THREE.MeshLambertMaterial({ map: texture, transparent: true });
            const mesh = new THREE.Mesh(geometry, material);
            
            mesh.position.set(startX + col * horizontalSpacing, -row * verticalSpacing, -row * 0.1);
            mesh.userData = { imageId: texture.imageId, targetPos: mesh.position.clone() };
            this.scene.add(mesh);
            this.imageMeshes.push(mesh);
        });
        
        const totalRows = Math.ceil(textures.length / columns);
        this.maxScroll = -(Math.max(totalRows - 1, 0) * verticalSpacing);
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // H 键切换 UI 显示
        window.addEventListener('keydown', e => {
            if (e.key.toLowerCase() === 'h') {
                document.body.classList.toggle('ui-visible');
            }
        });

        this.renderer.domElement.addEventListener('wheel', e => {
            e.preventDefault();
            if (e.altKey) this.gridZoomTarget = THREE.MathUtils.clamp(this.gridZoomTarget * Math.exp(e.deltaY * 0.0018), 0.14, 2.8);
            else this.gridScrollTarget = THREE.MathUtils.clamp(this.gridScrollTarget - e.deltaY * 0.18, this.maxScroll, 0);
        });

        let isDragging = false, lastX = 0, lastY = 0;
        this.renderer.domElement.addEventListener('mousedown', e => {
            if (this.modalManager.isModalVisible()) return;
            const intersects = this.getIntersects();
            if (intersects.length > 0) this.handleMeshClick(intersects[0].object);
            else if (e.shiftKey) { isDragging = true; lastX = e.clientX; lastY = e.clientY; }
        });

        window.addEventListener('mousemove', e => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            if (isDragging) {
                this.gridPanTarget = THREE.MathUtils.clamp(this.gridPanTarget + (e.clientX - lastX) * 0.35, -50, 50);
                this.gridScrollTarget = THREE.MathUtils.clamp(this.gridScrollTarget + (e.clientY - lastY) * 0.35, this.maxScroll, 0);
                lastX = e.clientX; lastY = e.clientY;
            }
            const intersects = this.getIntersects();
            this.renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : isDragging ? 'move' : 'default';
            this.hoveredMesh = intersects.length > 0 ? intersects[0].object : null;
        });

        window.addEventListener('mouseup', () => isDragging = false);
    }

    getIntersects() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        return this.raycaster.intersectObjects(this.imageMeshes);
    }

    handleMeshClick(mesh) {
        mesh.userData.pulseScale = 1.35;
        this.modalManager.show({ id: mesh.userData.imageId - 1, img: { src: mesh.material.map.image.src || '' } });
    }

    initGuide() {
        const btn = document.getElementById('guide-btn');
        const modal = document.getElementById('guide-modal');
        if (!btn || !modal) return;
        const close = modal.querySelector('.close-btn');
        btn.onclick = () => modal.style.display = 'flex';
        close.onclick = () => modal.style.display = 'none';
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.gridScrollCurrent += (this.gridScrollTarget - this.gridScrollCurrent) * 0.15;
        this.gridZoomCurrent += (this.gridZoomTarget - this.gridZoomCurrent) * 0.12;
        this.gridPanCurrent += (this.gridPanTarget - this.gridPanCurrent) * 0.12;

        this.camera.position.set(this.gridPanCurrent, this.gridScrollCurrent, 20.32 * this.gridZoomCurrent);
        this.camera.lookAt(this.gridPanCurrent, this.gridScrollCurrent, 0);

        this.imageMeshes.forEach(mesh => {
            const isHovered = mesh === this.hoveredMesh;
            mesh.position.z += (mesh.userData.targetPos.z + (isHovered ? 6 : 0) - mesh.position.z) * 0.12;
            if (mesh.userData.pulseScale === undefined) mesh.userData.pulseScale = 1.0;
            mesh.userData.pulseScale += (1.0 - mesh.userData.pulseScale) * 0.12;
            const s = (isHovered ? 1.15 : 1.0) * mesh.userData.pulseScale;
            mesh.scale.set(s, s, 1);
        });
        this.renderer.render(this.scene, this.camera);
    }
}

// 启动
window.addEventListener('DOMContentLoaded', () => {
    const checkThree = setInterval(() => {
        if (window.THREE) {
            clearInterval(checkThree);
            new ImageGallery3D();
        }
    }, 100);
});
