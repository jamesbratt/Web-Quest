import Phaser from 'phaser'

export default {
    type: Phaser.AUTO,
    backgroundColor: '#78c7f2',
    scale: {
        parent: 'content',
        mode: Phaser.Scale.RESIZE,
        expandParent: false
    },
    localStorageName: 'phaseres6webpack',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    }
}
