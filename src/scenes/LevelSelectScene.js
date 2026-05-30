import * as Phaser from 'phaser';
import GameState   from '../config/GameState.js';
import REGIONS     from '../data/regions/index.js';
import DialogBox   from '../ui/DialogBox.js';
import { openBounties } from '../ui/BountyOverlay.js';
import { openPasture } from '../ui/PastureOverlay.js';

export default class LevelSelectScene extends Phaser.Scene {
  constructor() { super({ key: 'LevelSelectScene' }); }

  init(data) {
    this.regionId = data.regionId;
    this.world = REGIONS[this.regionId];
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Draw background
    if (this.textures.exists('map_parchment')) {
      this.add.image(W / 2, H / 2, 'map_parchment').setDisplaySize(W, H).setAlpha(0.6);
    } else {
      this.cameras.main.setBackgroundColor('#2A3A2A');
    }

    // World Name
    this.add.text(W / 2, 40, this.world.name, {
      fontSize: '32px', color: '#FFD700', fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(W / 2, 80, this.world.subtitle, {
      fontSize: '18px', color: '#AACCEE', fontFamily: "'Nunito', Arial, sans-serif", stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    // Layout the levels in a simple line or curve
    const levels = this.world.levels || [];
    const spacing = Math.min((W - 100) / (levels.length || 1), 160);
    const startX = W / 2 - ((levels.length - 1) * spacing) / 2;
    const centerY = H / 2;

    // Draw path
    const gfx = this.add.graphics();
    gfx.lineStyle(6, 0xC8A86A, 0.8);
    gfx.beginPath();
    for (let i = 0; i < levels.length; i++) {
      const lx = startX + i * spacing;
      const ly = centerY + Math.sin(i * 1.5) * 60; // Curve the path slightly
      if (i === 0) gfx.moveTo(lx, ly);
      else gfx.lineTo(lx, ly);
    }
    gfx.strokePath();

    // Draw nodes
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      const lx = startX + i * spacing;
      const ly = centerY + Math.sin(i * 1.5) * 60;

      // Is it unlocked?
      // Level is unlocked if it's the first level, OR if the previous level is cleared.
      let unlocked = i === 0;
      if (i > 0) {
         unlocked = GameState.isLevelCleared(levels[i-1].id);
      }
      const cleared = GameState.isLevelCleared(level.id);

      // Node base
      let node;
      if (unlocked && this.textures.exists('map_pin')) {
        node = this.add.image(lx, ly, 'map_pin').setDisplaySize(50, 50);
        if (cleared) {
          node.setTint(0x88FF88); // Green tint if completed
        }
      } else {
        node = this.add.circle(lx, ly, 25, unlocked ? (cleared ? 0x228822 : 0xDD8822) : 0x555555)
          .setStrokeStyle(3, 0xFFFFFF);
      }

      // Icons above node
      if (level.isBossLevel) {
         this.add.text(lx, ly - 35, '💀', { fontSize: '24px' }).setOrigin(0.5);
      } else if (!unlocked) {
         this.add.text(lx, ly - 35, '🔒', { fontSize: '20px' }).setOrigin(0.5);
      } else if (cleared) {
         this.add.text(lx, ly - 35, '⭐', { fontSize: '20px' }).setOrigin(0.5);
      }

      // Label below node
      this.add.text(lx, ly + 35, level.name, {
        fontSize: '16px', color: unlocked ? '#FFFFFF' : '#888888',
        fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold', stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5);

      // Interaction
      if (unlocked) {
        node.setInteractive({ useHandCursor: true });
        node.on('pointerover', () => node.setScale(1.2));
        node.on('pointerout',  () => node.setScale(1.0));
        node.on('pointerdown', () => {
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('ExploreScene', { regionId: this.regionId, levelId: level.id });
          });
        });

        // Bounce animation for the current active (uncleared) level
        if (!cleared && !this._bouncingNode) {
          this._bouncingNode = node;
          this.tweens.add({ targets: node, y: node.y - 8, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
      }
    }

    // Back to World Map Button
    const backBtn = this.add.rectangle(W / 2, H - 60, 220, 44, 0x1A2A44).setStrokeStyle(2, 0x4488FF).setInteractive({ useHandCursor: true });
    const backTxt = this.add.text(W / 2, H - 60, '↩ Back to World Map', {
      fontSize: '18px', color: '#AADDFF', fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5);
    
    backBtn.on('pointerover', () => { backBtn.setFillStyle(0x2A4A88); backTxt.setColor('#FFFFFF'); });
    backBtn.on('pointerout', () => { backBtn.setFillStyle(0x1A2A44); backTxt.setColor('#AADDFF'); });
    backBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('OverworldScene');
      });
    });

    // --- Hub Shops ---
    
    // Bounty Board Button (Bottom Left)
    const bbx = 100;
    const bby = H - 40;
    const bbBtn = this.add.rectangle(bbx, bby, 160, 44, 0x0A180A)
      .setStrokeStyle(2, 0x44AA44).setInteractive({ useHandCursor: true });
    const bbTxt = this.add.text(bbx, bby, '📋 Bounty Board', {
      fontSize: '16px', color: '#88FF88', fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5);
    
    bbBtn.on('pointerover', () => { bbBtn.setFillStyle(0x153015); bbTxt.setColor('#AAFFAA'); });
    bbBtn.on('pointerout', () => { bbBtn.setFillStyle(0x0A180A); bbTxt.setColor('#88FF88'); });
    bbBtn.on('pointerdown', () => openBounties(this, 300));

    // Pasture Gate Button (Bottom Right)
    const pgx = W - 100;
    const pgy = H - 40;
    const pgBtn = this.add.rectangle(pgx, pgy, 160, 44, 0x0A0A18)
      .setStrokeStyle(2, 0x4466FF).setInteractive({ useHandCursor: true });
    const pgTxt = this.add.text(pgx, pgy, '🏡 Pasture', {
      fontSize: '16px', color: '#88AAFF', fontFamily: "'Nunito', Arial, sans-serif", fontStyle: 'bold'
    }).setOrigin(0.5);
    
    pgBtn.on('pointerover', () => { pgBtn.setFillStyle(0x151530); pgTxt.setColor('#AADDFF'); });
    pgBtn.on('pointerout', () => { pgBtn.setFillStyle(0x0A0A18); pgTxt.setColor('#88AAFF'); });
    pgBtn.on('pointerdown', () => openPasture(this, 300));

    this.dialog = new DialogBox(this);

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }
}
