(function (THREE, callback) {

    if (typeof THREE === 'undefined') return false;

    if (typeof INITTHREE !== 'function') window.INITTHREE = callback
})(THREE, function (container, options) {

    let conWidth, conHeight;

    container = container || document.body

    conWidth = container.offsetWidth;
    conHeight = container.offsetHeight;

    options = {
        needShadow: true,
        needStats: true,
        needControls: true,
        clearColor: '#ffffff',
        cameraType: 'PerspectiveCamera',
        needEnviromentLight: true,
        EnviromentLightColor: 0x404040,
        cameraOptions: [45, conWidth / conHeight, 0.1, 10000],
        cameraPosition: [0, 0, 500],
        sceneType: 'Scene',
        statsPosition: {},
        ...options
    }

    const INITMETHODS = {
        initRenderer() {
            let renderer = new THREE.WebGLRenderer({
                antialias: true
            });


            conWidth = container.offsetWidth;
            conHeight = container.offsetHeight;

            renderer.setSize(conWidth, conHeight);

            renderer.setPixelRatio(window.devicePixelRatio);

            renderer.shadowMap.enabled = options.needShadow;

            // 设置渲染器背景色
            renderer.setClearColor(options.clearColor);

            // 将渲染器绑定在页面dom节点上
            container.appendChild(renderer.domElement);

            return renderer
        },
        initScene() {
            return THREE[options.sceneType] ? new THREE[options.sceneType]() :
                new THREE.Scene();
        },
        initCamera() {
            let camera;

            camera = THREE[options.cameraType] ?
                new THREE[options.cameraType](...options.cameraOptions) :
                new THREE.PerspectiveCamera(...options.cameraOptions)

            camera.position.set(...options.cameraPosition)
            camera.lookAt(new THREE.Vector3(0, 0, 0))

            return camera
        }
    }

    /**
     * 处理onresize事件
     */
    const resizeHandle = function () {
        conWidth = container.offsetWidth;
        conHeight = container.offsetHeight;

        INIT.renderer.setSize(conWidth, conHeight);

        INIT.camera.aspect = conWidth / conHeight;
        INIT.camera.updateProjectionMatrix();
    }


    let children = [];

    /**
     * 添加事件
     * 
     */
    const eventHandler = function (event, eventType) {
        let rayCaster, mouse, intersects;

        rayCaster = new THREE.Raycaster()
        mouse = new THREE.Vector3()

        // 将页面坐标转化成归一化坐标 =》 [-1, 1]闭区间内
        mouse.x = (event.offsetX / conWidth) * 2 - 1
        mouse.y = -(event.offsetY / conHeight) * 2 + 1
        mouse.z = 0

        // 将屏幕坐标转化为三维坐标
        // mouse.unproject(INIT.camera);

        // 通过鼠标点的位置和当前相机的矩阵计算出raycaster
        rayCaster.setFromCamera(mouse, INIT.camera)

        children = []
        getWholeChildren(INIT.scene.children)

        intersects = rayCaster.intersectObjects(children)

        intersects = intersects.filter(v => v.object.type === 'Mesh')

        intersects.length > 0 && intersects[0].object[eventType] && intersects[0].object[eventType]()
    }

    const getWholeChildren = function (arr) {
        arr.forEach(v => {
            if (v.children.length > 0) {
                getWholeChildren(v.children)
            } else {
                children.push(v)
            }
        });
    }

    /**
     * statsJs的初始化
     * @param {object} container - 装画布的容器
     * @param {object} positionOptions - dom元素的位置定位信息 {}
     */
    const initStats = function () {
        let stats = new Stats();

        let positionOptions = {
            position: "absolute",
            left: "auto",
            top: "10px",
            right: "10px",
            ...options.statsPosition
        };

        container.appendChild(stats.dom);

        for (let k in positionOptions) {
            stats.dom.style[k] = positionOptions[k]
        }

        INIT.stats = stats

        return stats;
    }

    /**
     * 
     */
    const initOrbitControls = function () {
        INIT.orbitControls = new THREE.OrbitControls(INIT.camera, INIT.renderer.domElement)

        return INIT.orbitControls
    }

    const addEnviromentLight = function () {

        let environmentLight = new THREE.AmbientLight(options.EnviromentLightColor);

        INIT.scene.add(environmentLight);
    }

    const INIT = {
        scene: INITMETHODS.initScene(),
        camera: INITMETHODS.initCamera(),
        renderer: INITMETHODS.initRenderer()
    }

    options.needStats && initStats();
    options.needControls && initOrbitControls();
    options.needEnviromentLight && addEnviromentLight();

    window.addEventListener('resize', resizeHandle);
    container.addEventListener('click', () => eventHandler(event, 'onclick'));
    // container.addEventListener('mouseover', () => eventHandler(event, 'mouseover'));


    INIT.create = function (CONSTRUCTOR, ...params) {
        return new THREE[CONSTRUCTOR](...params)
    }

    return INIT;
})