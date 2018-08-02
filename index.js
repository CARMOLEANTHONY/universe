/**
 * @author CARMOLEANTHONY
 * @version 1.0
 * 2018-08-01
 */

$(function () {
    let container, renderer, camera, scene, orbitControls, C;
    let waitingExcutiveTasks, initTasks;
    let sun, earth, jupiter, mars, mercury, neptune, saturn, uranus, venus;
    let sunGroup, earthGroup, jupiterGroup, marsGroup, mercuryGroup, neptuneGroup, saturnGroup, uranusGroup, venusGroup;
    let planetParams, planets, planetGroups;
    let sunLight;
    let stars, starCount, starPositions, starColors, starMinDistance, starMaxDistance, starGeometry, colorModle;

    container = $("#canvas-frame")[0]

    const _INITTHREE = INITTHREE(container, {
        clearColor: '#000',
        cameraPosition: [50, 50, 4000],
        EnviromentLightColor: 0xaaaaaa,
        needStats: false,
        needControls: true
    })

    renderer = _INITTHREE.renderer
    camera = _INITTHREE.camera
    scene = _INITTHREE.scene
    orbitControls = _INITTHREE.orbitControls
    C = _INITTHREE.create

    orbitControls.lookVertical = true

    renderer.shadowMapSoft = true;

    waitingExcutiveTasks = [] // 待执行的动画事件
    initTasks = [] // 待初始化的物体

    // 有关星球的变量初始化
    planets = []
    planetGroups = []

    // 有关远处星星的变量初始化
    stars = []
    starCount = 20000
    starMinDistance = 10000
    starMaxDistance = 18000
    colorModle = C('Color')
    starPositions = new Float32Array(starCount * 3)
    starColors = new Float32Array(starCount * 3)
    starGeometry = C('BufferGeometry')

    function render() {
        requestAnimationFrame(render)

        renderer.render(scene, camera)

        waitingExcutiveTasks.length > 0 && waitingExcutiveTasks.forEach(item => item());

    }

    function init() {
        initTasks.length > 0 && initTasks.forEach(item => scene.add(item))

        render()
    }

    planetParams = [
        ['sun', 200, './images/sun.png', sun, sunGroup, 0, 0, 0, 0, 0, 0, 0],
        ['mercury', 20, './images/mercury.jpeg', mercury, mercuryGroup, 2000, 0.01, 500, 250],
        ['venus', 40, './images/venus.png', venus, venusGroup, 1500, 0.01, 540, 300],
        ['earth', 40, './images/earth.png', earth, earthGroup, 3000, 0.02, 600, 400],
        ['mars', 15, './images/mars.png', mars, marsGroup, 3300, 0.015, 870, 480],
        ['jupiter', 80, './images/jupiter.png', jupiter, jupiterGroup, 4000, 0.022, 1000, 600],
        ['saturn', 40, './images/saturn.jpeg', saturn, saturnGroup, 2500, 0.06, 1200, 754],
        ['uranus', 40, './images/uranus.png', uranus, uranusGroup, 1700, 0.018, 1220, 890],
        ['neptune', 30, './images/neptune.png', neptune, neptuneGroup, 3800, 0.03, 1400, 1000]
    ]


    // 画球体
    planetParams.forEach(item => initTasks.push(strokeplanet(...item)))

    // 添加自转
    waitingExcutiveTasks.push(privateRotation)

    // 添加公转
    waitingExcutiveTasks.push(commonRotation)

    // 画太阳光
    sunLight = C('PointLight', 0xfffff, 3)
    sunLight.position.set(0, 0, 0)

    // 添加太阳光晕
    initTasks.push(strokeHalo(235, 0xff3300, 0, 0, 0))

    // 添加太阳光源
    initTasks.push(sunLight)

    // 添加星星
    initTasks.push(strokeStar())

    /**
     * 星球自转
     */
    function privateRotation() {
        planets.forEach(v => v.rotation.z += v.privateSpeed)
    }

    /**
     * 星球公转
     */
    function commonRotation() {
        planets.forEach(v => {

            let p = v.ellipseVertices[v.currentIndex]

            p && v.position.set(p.x, p.y, p.z)

            v.currentIndex = v.currentIndex < 1 ? v.commonSpeed : v.currentIndex - 1
        })
    }


    /**
     * 画一个球体
     * @param {string} planetName 星球名称
     * @param {number} radius 球半径
     * @param {string} url 纹理路径
     * @param {Object} planet 存储球的变量
     * @param {Object} planetGroup 存储球的组
     * @param {number} commonSpeed 公转速度
     * @param {number} privateSpeed 自转速度
     * @param {number} a 椭圆长轴
     * @param {number} b 椭圆短轴
     */
    function strokeplanet(planetName, radius, url, planet, planetGroup, commonSpeed, privateSpeed, a, b) {
        let planetGeometry, planetMaterial, ellipse, currentPosition;

        planetGroup = C('Group')

        ellipse = createEllipse(a, b, commonSpeed)

        planetGroup.position.set(0, 0, 0)

        planetGeometry = C('SphereGeometry', radius, 32, 32)

        planetMaterial = url === 'undefined' ? C('MeshPhongMaterial') : createTexture(url, planetName === 'sun' ? 0xff3300 : '')

        planet = C('Mesh', planetGeometry, planetMaterial)

        planet.castShadow = true
        planet.receiveShadow = true
        planet.name = planetName

        planet.privateSpeed = privateSpeed
        planet.commonSpeed = commonSpeed
        planet.currentIndex = parseInt(Math.random() * commonSpeed)
        planet.ellipseVertices = ellipse.geometry.vertices

        currentPosition = planet.ellipseVertices[planet.currentIndex] || {
            x: 0,
            y: 0,
            z: 0
        }
        planet.position.set(currentPosition.x, currentPosition.y, currentPosition.z)

        planetGroup.add(ellipse)
        planetGroup.add(planet)

        planets.push(planet)
        planetGroups.push(planetGroup)

        return planetGroup
    }

    /**
     * 创建一个纹理
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

        curve = C('EllipseCurve', 0, 0, a, b, 0, 2 * Math.PI, true, -0.2)

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
            opacity: .25
        })

        halo = C('Mesh', sphereGeometry, sphereMaterial)

        halo.position.set(...position)

        return halo
    }

    /**
     * 画星星
     */
    function strokeStar() {
        let starMaterial;

        starMaterial = C('PointsMaterial', {
            size: parseInt(Math.random() * 40 + 15)
        })

        addAttrToStarGeometry()

        stars = C('Points', starGeometry, starMaterial)

        return stars
    }

    /**
     * 给星星材料添加坐标属性和颜色属性
     */
    function addAttrToStarGeometry() {
        let x, y, z, randomNumm, r, g, b;


        for (let i = 0; i < starPositions.length; i += 3) {
            r = Math.random()
            g = Math.random()
            b = Math.random()

            colorModle.setRGB(r, g, b)

            starColors[i] = colorModle.r
            starColors[i + 1] = colorModle.g
            starColors[i + 2] = colorModle.b

            x = (parseInt(Math.random() * (starMaxDistance - starMinDistance)) + starMinDistance) * (Math.random() > 0.5 ? 1 : -1)

            y = (parseInt(Math.random() * starMaxDistance)) * (Math.random() > 0.5 ? 1 : -1)
            z = (parseInt(Math.random() * starMaxDistance)) * (Math.random() > 0.5 ? 1 : -1)

            randomNum = parseInt(Math.random() * 3)

            switch (randomNum) {
                case 0:
                    starPositions[i] = x
                    starPositions[i + 1] = y
                    starPositions[i + 2] = z
                    break;
                case 1:
                    starPositions[i] = y
                    starPositions[i + 1] = x
                    starPositions[i + 2] = z
                    break;
                default:
                    starPositions[i] = y
                    starPositions[i + 1] = z
                    starPositions[i + 2] = x
            }
        }


        starGeometry.addAttribute('position', C('BufferAttribute', starPositions, 3))
        starGeometry.addAttribute('color', C('BufferAttribute', starColors, 3))
    }


    init()
})