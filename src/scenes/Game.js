import Phaser from 'phaser'
import { createGroundProfile } from '../ground'
import { extractPlatformDataFromBrowser } from '../utils'

const GROUND_SAMPLE_SPACING = 5

export default class extends Phaser.Scene {
    constructor () {
        super({ key: 'GameScene' })
        this.cursors = null
        this.player = null
        this.groundHeightAt = null
        this.grounded = false
    }

    startGame () {
        this.player = this.physics.add.sprite(100, 300, 'dude')
        this.physics.world.setBounds(0, 0, 10000, 600)
        this.terrain = this.add.graphics().setDepth(-1)
        this.fitCameraToWorld(this.scale.gameSize)
        this.scale.on(Phaser.Scale.Events.RESIZE, this.fitCameraToWorld, this)
        this.physics.world.on(Phaser.Physics.Arcade.Events.WORLD_STEP, this.resolveGround, this)
        this.events.once('shutdown', () => {
            this.scale.off(Phaser.Scale.Events.RESIZE, this.fitCameraToWorld, this)
            this.physics.world.off(Phaser.Physics.Arcade.Events.WORLD_STEP, this.resolveGround, this)
        })
        this.cameras.main.startFollow(this.player)
        this.player.setCollideWorldBounds(true)
    }

    fitCameraToWorld ({ height }) {
        const bounds = this.physics.world.bounds
        const cameraHeight = Math.max(height, bounds.height)
        this.cameras.main.setBounds(bounds.x, bounds.bottom - cameraHeight, bounds.width, cameraHeight)
    }

    renderScene (sceneData) {
        const { right, bottom } = this.physics.world.bounds
        this.groundHeightAt = createGroundProfile(sceneData.children, right, bottom)
        const surface = []
        for (let x = 0; x < right; x += GROUND_SAMPLE_SPACING) {
            surface.push({ x, y: this.groundHeightAt(x) })
        }
        surface.push({ x: right, y: this.groundHeightAt(right) })

        const lastRaisedPoint = surface.findLastIndex(point => point.y < bottom)
        if (lastRaisedPoint === -1) return
        surface.length = Math.min(surface.length, lastRaisedPoint + 2)
        const end = surface[surface.length - 1]
        this.terrain.fillStyle(0x318447)
            .fillPoints([...surface, { x: end.x, y: bottom }, { x: 0, y: bottom }], true)
            .lineStyle(2, 0x205f34)
            .strokePoints(surface)
    }

    resolveGround () {
        const body = this.player.body
        const groundY = this.groundHeightAt?.(body.center.x) ?? this.physics.world.bounds.bottom
        if (!this.grounded && body.bottom < groundY) return

        body.position.y = groundY - body.height
        body.updateCenter()
        body.setVelocityY(0)
        this.grounded = true
    }

    preload () {
        this.load.spritesheet('dude',
            './assets/images/dude.png',
            { frameWidth: 32, frameHeight: 48 }
        )
    }

    watchInspectedTab () {
        const inspectedTabId = chrome.devtools.inspectedWindow.tabId
        let requestId = 0

        const refresh = async () => {
            const currentRequest = ++requestId
            let sceneData
            try {
                sceneData = await extractPlatformDataFromBrowser(inspectedTabId)
            } catch (error) {
                if (currentRequest === requestId) console.warn('Could not read the inspected page', error)
            }

            if (currentRequest !== requestId) return

            this.terrain.clear()
            this.groundHeightAt = null
            this.grounded = false
            this.player.body.reset(100, 300)
            if (sceneData) this.renderScene(sceneData)
        }

        const onTabUpdated = (tabId, { status }) => {
            if (tabId === inspectedTabId && status === 'complete') void refresh()
        }

        chrome.tabs.onUpdated.addListener(onTabUpdated)
        this.events.once('shutdown', () => {
            ++requestId
            chrome.tabs.onUpdated.removeListener(onTabUpdated)
        })
        void refresh()
    }

    create () {
        this.startGame()
        if (process.env.NODE_ENV === 'production') {
            this.watchInspectedTab()
        } else {
            const devData = require('../../fixtures/dev-data.json')
            this.renderScene(devData)
        }

        this.cursors = this.input.keyboard.createCursorKeys()

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        })

        this.anims.create({
            key: 'turn',
            frames: [{ key: 'dude', frame: 4 }],
            frameRate: 20
        })

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        })
    }

    update () {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160)

            this.player.anims.play('left', true)
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160)
            this.player.anims.play('right', true)
        } else {
            this.player.setVelocityX(0)
            this.player.anims.play('turn')
        }

        if (this.cursors.up.isDown && this.grounded) {
            this.grounded = false
            this.player.setVelocityY(-150)
        }
    }
}
