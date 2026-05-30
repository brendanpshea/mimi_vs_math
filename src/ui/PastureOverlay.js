import GameState from '../config/GameState.js';
import ENEMIES from '../data/enemies.js';
import ITEMS from '../data/items.js';

const FONT = "'Nunito', Arial, sans-serif";
const FONT_TITLE = "'Fredoka', 'Nunito', Arial, sans-serif";

export function openPasture(scene, depth = 200, onClose = null) {
  if (scene._pastureItems) return;

  const D = depth;
  const W = scene.cameras.main.width;
  const H = scene.cameras.main.height;
  let items = scene._pastureItems = [];
  const add = o => { items.push(o); return o; };

  // Calculate pasture rewards early
  const rewards = GameState.calculatePastureRewards();

  // Dim background
  const dim = add(scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.82)
    .setDepth(D).setScrollFactor(0).setInteractive());
  dim.on('pointerdown', () => closePasture(scene, onClose));

  // Panel
  add(scene.add.rectangle(W / 2, H / 2, 500, 420, 0x0C0C24)
    .setDepth(D + 1).setScrollFactor(0).setStrokeStyle(2.5, 0x00A8FF));

  // Title
  add(scene.add.text(W / 2, H / 2 - 180, '🏡  Mimi’s Pasture', {
    fontSize: '24px', color: '#00D8FF', fontFamily: FONT_TITLE, fontStyle: 'bold',
    stroke: '#000', strokeThickness: 3
  }).setOrigin(0.5).setDepth(D + 2).setScrollFactor(0));

  // Summary of items harvested
  if (rewards && rewards.length > 0) {
    const summary = rewards.map(r => {
      const it = ITEMS[r.itemId];
      return `${r.enemyName} generated ${r.count} × ${it?.emoji ?? '🎁'} ${it?.name}!`;
    }).join('\n');

    // Large floating chest toast/dialogue
    scene.dialog?.show(`🎁 Your captured pets have been working hard while you were gone!\n\n${summary}`, null, '🏡 Pasture Harvest!');
  }

  const refresh = () => {
    // Clear dynamic cards (anything past index 2)
    items.slice(3).forEach(o => o.destroy());
    items = items.slice(0, 3);
    scene._pastureItems = items;

    const pets = GameState.capturedEnemies || [];

    if (pets.length === 0) {
      add(scene.add.text(W / 2, H / 2, 'The pasture is currently empty.\n\nUse a Math Net in battle when an enemy is at <= 2 HP\nto capture them and start generating items!', {
        fontSize: '14px', color: '#8899BB', fontFamily: FONT, align: 'center', lineSpacing: 6
      }).setOrigin(0.5).setDepth(D + 2).setScrollFactor(0));
    } else {
      let startY = H / 2 - 120;
      
      // Limit list to top 4 pets to avoid UI spill; Gemini Flash friendly scrolling-less card design
      pets.slice(0, 4).forEach((pet, i) => {
        const cy = startY + i * 70;
        
        // Pet Card Background
        add(scene.add.rectangle(W / 2, cy, 440, 56, 0x11162C)
          .setStrokeStyle(1, 0x334466).setDepth(D + 2).setScrollFactor(0));

        // Pet Icon / Text
        const baseDef = ENEMIES[pet.id];
        const titleStr = `${pet.name} (Grade ${baseDef?.region != null ? baseDef.region + 1 : '?'})`;
        add(scene.add.text(W / 2 - 200, cy - 12, titleStr, {
          fontSize: '13px', color: '#00FFCC', fontFamily: FONT, fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(D + 3).setScrollFactor(0));

        // Pet Description
        const descStr = baseDef?.bio ? (baseDef.bio.slice(0, 68) + '...') : 'A captured helper cat.';
        add(scene.add.text(W / 2 - 200, cy + 12, descStr, {
          fontSize: '11px', color: '#88AACC', fontFamily: FONT
        }).setOrigin(0, 0.5).setDepth(D + 3).setScrollFactor(0));

        // Pet Generation Rate Badge
        const rateStr = pet.id === 'slime_pup' ? '⚡ 1 Sardine / 12h' : '🌱 1 Buff / 12h';
        add(scene.add.text(W / 2 + 200, cy, rateStr, {
          fontSize: '11px', color: '#FFDD44', fontFamily: FONT, fontStyle: 'bold'
        }).setOrigin(1, 0.5).setDepth(D + 3).setScrollFactor(0));
      });

      if (pets.length > 4) {
        add(scene.add.text(W / 2, H / 2 + 150, `...and ${pets.length - 4} more pets happily grazing!`, {
          fontSize: '12px', color: '#8899BB', fontFamily: FONT
        }).setOrigin(0.5).setDepth(D + 2).setScrollFactor(0));
      }
    }
  };

  refresh();

  // Close button
  const cb = add(scene.add.rectangle(W / 2, H / 2 + 186, 160, 34, 0x2A0A0A)
    .setDepth(D + 2).setScrollFactor(0).setStrokeStyle(1.5, 0xCC4444)
    .setInteractive({ useHandCursor: true }));
  const ct = add(scene.add.text(W / 2, H / 2 + 186, '✕  Close', {
    fontSize: '14px', color: '#FF8888', fontFamily: FONT, fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(D + 3).setScrollFactor(0));
  
  cb.on('pointerover', () => { cb.setFillStyle(0x401515); ct.setColor('#FFAAAA'); });
  cb.on('pointerout',  () => { cb.setFillStyle(0x2A0A0A); ct.setColor('#FF8888'); });
  cb.on('pointerdown', () => closePasture(scene, onClose));

  scene._pastureEscKey = scene.input.keyboard.once('keydown-ESC', () => closePasture(scene, onClose));
}

export function closePasture(scene, onClose = null) {
  if (!scene._pastureItems) return;
  scene._pastureItems.forEach(o => o.destroy());
  scene._pastureItems = null;
  scene._pastureEscKey = null;
  if (typeof onClose === 'function') onClose();
}
