/**
 * @author CARMOLEANTHONY
 * @version 1.0
 * 2018-08-01
 */

$(function () {
    let container, renderer, camera, scene, orbitControls, C;
    let waitingExcutiveTasks, initTasks;
    let sun, haloSun, earth, jupiter, mars, mercury, neptune, saturn, uranus, venus;
    let sunGroup, earthGroup, jupiterGroup, marsGroup, mercuryGroup, neptuneGroup, saturnGroup, uranusGroup, venusGroup;
    let starParams, stars, starGroups;
    let sunLight;

    container = $("#canvas-frame")[0]

    const _INITTHREE = INITTHREE(container, {
        clearColor: '#000',
        cameraPosition: [50, 50, 3500],
        EnviromentLightColor: 0x404040,
        needStats: false,
        needControls: true
    })

    renderer = _INITTHREE.renderer
    camera = _INITTHREE.camera
    scene = _INITTHREE.scene
    orbitControls = _INITTHREE.orbitControls
    C = _INITTHREE.create

    renderer.shadowMapSoft = true;

    waitingExcutiveTasks = []
    initTasks = []
    stars = []
    starGroups = []

    function render() {
        requestAnimationFrame(render)

        renderer.render(scene, camera)

        waitingExcutiveTasks.length > 0 && waitingExcutiveTasks.forEach(item => item());

    }

    function init() {
        initTasks.length > 0 && initTasks.forEach(item => scene.add(item))

        render()
    }

    starParams = [
        ['sun', 200, './images/sun.jpeg', sun, sunGroup, 0, 0, 0, 0, 0, 0, 0],
        ['mercury', 20, './images/mercury.jpeg', mercury, mercuryGroup, 2000, 0.01, 400, 250],
        ['venus', 40, './images/venus.png', venus, venusGroup, 1500, 0.01, 520, 300, 520],
        ['earth', 40, './images/earth.png', earth, earthGroup, 3000, 0.02, 700, 400],
        ['mars', 15, './images/mars.png', mars, marsGroup, 3300, 0.015, 870, 480],
        ['jupiter', 80, './images/jupiter.png', jupiter, jupiterGroup, 4000, 0.022, 1000, 600],
        ['saturn', 40, './images/saturn.jpeg', saturn, saturnGroup, 2500, 0.016, 1200, 754],
        ['uranus', 40, './images/uranus.png', uranus, uranusGroup, 1700, 0.018, 1300, 890],
        ['neptune', 30, './images/neptune.png', neptune, neptuneGroup, 3800, 0.03, 1400, 1000]
    ]


    // 画球体
    starParams.forEach(item => initTasks.push(strokeStar(...item)))

    // 添加自转
    waitingExcutiveTasks.push(privateRotation)

    // 添加公转
    waitingExcutiveTasks.push(commonRotation)

    // 画太阳光
    sunLight = C('PointLight', 0xfffff, 3)
    sunLight.position.set(0, 0, 0)

    // 添加太阳光晕
    initTasks.push(strokeHalo(230, 0xff0000, 0, 0, 0))

    // 添加太阳光源
    initTasks.push(sunLight)


    /**
     * 星球自转
     */
    function privateRotation() {
        stars.forEach(v => v.rotation.z += v.privateSpeed)
    }

    /**
     * 星球公转
     */
    function commonRotation() {
        stars.forEach(v => {

            let p = v.ellipseVertices[v.currentIndex]

            p && v.position.set(p.x, p.y, p.z)

            v.currentIndex = v.currentIndex < 1 ? v.commonSpeed : v.currentIndex - 1
        })
    }


    /**
     * 画一个球体
     * @param {string} starName 星球名称
     * @param {number} radius 球半径
     * @param {string} url 纹理路径
     * @param {Object} star 存储球的变量
     * @param {Object} starGroup 存储球的组
     * @param {number} commonSpeed 公转速度
     * @param {number} privateSpeed 自转速度
     * @param {number} a 椭圆长轴
     * @param {number} b 椭圆短轴
     */
    function strokeStar(starName, radius, url, star, starGroup, commonSpeed, privateSpeed, a, b) {
        let starGeometry, starMaterial, ellipse, currentPosition;

        starGroup = C('Group')

        ellipse = createEllipse(a, b, commonSpeed)

        starGroup.position.set(0, 0, 0)

        starGeometry = C('SphereGeometry', radius, 32, 32)

        starMaterial = url === 'undefined' ? C('MeshPhongMaterial') : createTexture(url, starName === 'sun' ? 0xff0000 : '')

        star = C('Mesh', starGeometry, starMaterial)

        star.castShadow = true
        star.receiveShadow = true
        star.name = starName

        star.privateSpeed = privateSpeed
        star.commonSpeed = commonSpeed
        star.currentIndex = parseInt(Math.random() * commonSpeed)
        star.ellipseVertices = ellipse.geometry.vertices

        currentPosition = star.ellipseVertices[star.currentIndex] || {
            x: 0,
            y: 0,
            z: 0
        }
        star.position.set(currentPosition.x, currentPosition.y, currentPosition.z)

        starGroup.add(ellipse)
        starGroup.add(star)

        stars.push(star)
        starGroups.push(starGroup)

        return starGroup
    }

    /**
     * 画一个纹理
     * @param {string} url 图片地址
     * @param {*} color 颜色
     */
    function createTexture(url, color) {
        let texture = C('TextureLoader').load(url)

        color = color === 'undefined' ? 0xffffff : color

        let material = C('MeshLambertMaterial', {
            map: texture,
            emissive: color
        });

        return material
    }

    /**
     * 画一个椭圆
     * @param {number} a 长轴
     * @param {number} b 短轴
     * @param {number} pointsCount 椭圆上点的数量
     */

    function createEllipse(a, b, pointsCount) {
        let curve, path, ellipseGeometry, ellipseMaterial, line;

        curve = C('EllipseCurve', 0, 0, a, b, 0, 2 * Math.PI, true, -0.3)

        path = C('Path', curve.getPoints(pointsCount))

        ellipseGeometry = path.createPointsGeometry(pointsCount)

        ellipseMaterial = C('LineBasicMaterial', {
            color: 0x888888,
            side: THREE.DoubleSide
        })

        line = C('Line', ellipseGeometry, ellipseMaterial)

        line.position.y = parseInt(Math.random() * 20 - 10)

        return line
    }

    /**
     * 画光晕
     * @param {number} radius 球半径
     * @param {*} color 颜色
     * @param {number} x,y,z 三维坐标
     */
    function strokeHalo(radius, color, ...position) {
        let sphereGeometry, sphereMaterial, halo;

        sphereGeometry = C('SphereGeometry', radius, 32, 32)
        sphereMaterial = C('MeshLambertMaterial', {
            color: color,
            transparent: true,
            opacity: .55
        })

        halo = C('Mesh', sphereGeometry, sphereMaterial)

        halo.position.set(...position)

        return halo
    }

    init()
})