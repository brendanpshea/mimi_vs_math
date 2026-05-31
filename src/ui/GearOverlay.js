import GameState from '../config/GameState.js';
import GEAR from '../data/gear.js';

const FONT = "'Nunito', Arial, sans-serif";
const FONT_TITLE = "'Fredoka', 'Nunito', Arial, sans-serif";

export function openGear(scene, depth = 200, onClose = null) {
  if (scene._gearItems) return;

  const D = depth;
  const W = scene.cameras.main.width;
  const H = scene.cameras.main.height;
  let items = scene._gearItems = [];
  const add = o => { items.push(o); return o; };

  // Dim background
  const dim = add(scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.82)
    .setDepth(D).setScrollFactor(0).setInteractive());
  dim.on('pointerdown', () => closeGear(scene, onClose));

  // Panel
  add(scene.add.rectangle(W / 2, H / 2, 500, 420, 0x090924)
    .setDepth(D + 1).setScrollFactor(0).setStrokeStyle(2.5, 0x9955FF));

  // Title
  add(scene.add.text(W / 2, H / 2 - 180, '🎒  Gear & Equipment', {
    fontSize: '24px', color: '#FFD700', fontFamily: FONT_TITLE, fontStyle: 'bold',
    stroke: '#000', strokeThickness: 3
  }).setOrigin(0.5).setDepth(D + 2).setScrollFactor(0));

  // Render Gear Slots
  const slots = ['weapon', 'hat', 'accessory'];
  const slotLabels = { weapon: '🗡️ Weapon', hat: '👒 Hat', accessory: '💎 Accessory' };
  
  let startY = H / 2 - 130;
  
  const refresh = () => {
    // Clear dynamic cards (anything past index 2 in items list)
    items.slice(3).forEach(o => o.destroy());
    items = items.slice(0, 3); // keep dim, panel, title
    scene._gearItems = items;
    
    slots.forEach((slot, sIdx) => {
      const cy = startY + sIdx * 94;
      const equippedId = GameState.equippedGear[slot];
      const eq = GEAR[equippedId];

      // Slot divider line
      if (sIdx > 0) {
        const line = add(scene.add.graphics().setDepth(D + 2).setScrollFactor(0));
        line.lineStyle(1, 0x334466, 0.5);
        line.lineBetween(W / 2 - 220, cy - 47, W / 2 + 220, cy - 47);
      }

      // Slot Title
      add(scene.add.text(W / 2 - 220, cy - 30, slotLabels[slot], {
        fontSize: '13px', color: '#AACCFF', fontFamily: FONT, fontStyle: 'bold'
      }).setOrigin(0, 0.5).setDepth(D + 2).setScrollFactor(0));

      // Equipped item display Card
      const cardX = W / 2 - 120;
      add(scene.add.rectangle(cardX, cy + 10, 180, 50, 0x110A24)
        .setStrokeStyle(1.5, 0xFFCC44).setDepth(D + 2).setScrollFactor(0));
      
      add(scene.add.text(cardX - 76, cy + 10, eq?.emoji ?? '✨', { fontSize: '20px' })
        .setOrigin(0, 0.5).setDepth(D + 3).setScrollFactor(0));
      add(scene.add.text(cardX - 44, cy + 10, eq?.name ?? 'None', {
        fontSize: '13px', color: '#FFFFFF', fontFamily: FONT, fontStyle: 'bold'
      }).setOrigin(0, 0.5).setDepth(D + 3).setScrollFactor(0));

      // List unlocked items for this slot
      const unlocked = GameState.unlockedGear.map(gId => GEAR[gId]).filter(g => g && g.slot === slot);
      const startBtnX = W / 2 + 10;
      
      unlocked.forEach((item, i) => {
        const bx = startBtnX + i * 46;
        const isEquipped = item.id === equippedId;
        
        const bg = add(scene.add.rectangle(bx, cy + 10, 38, 38, isEquipped ? 0x2A1166 : 0x050C1F)
          .setStrokeStyle(1.5, isEquipped ? 0x9955FF : 0x2244AA).setDepth(D + 2).setScrollFactor(0)
          .setInteractive({ useHandCursor: true }));
        
        const icon = add(scene.add.text(bx, cy + 10, item.emoji, { fontSize: '18px' })
          .setOrigin(0.5).setDepth(D + 3).setScrollFactor(0));

        bg.on('pointerover', () => {
          if (!isEquipped) bg.setFillStyle(0x112244);
          // Show quick description tooltip
          const tipBg = add(scene.add.rectangle(W / 2, H / 2 + 158, 440, 34, 0x050515)
            .setStrokeStyle(1, 0x9955FF).setDepth(D + 4).setScrollFactor(0));
          const tipTxt = add(scene.add.text(W / 2, H / 2 + 158, `${item.name}: ${item.description}`, {
            fontSize: '11px', color: '#AADDFF', fontFamily: FONT, fontStyle: 'bold'
          }).setOrigin(0.5).setDepth(D + 5).setScrollFactor(0));
          bg._tip = [tipBg, tipTxt];
        });
        bg.on('pointerout', () => {
          if (!isEquipped) bg.setFillStyle(0x050C1F);
          if (bg._tip) {
            bg._tip.forEach(o => o.destroy());
            bg._tip = null;
          }
        });
        bg.on('pointerdown', () => {
          if (bg._tip) {
            bg._tip.forEach(o => o.destroy());
            bg._tip = null;
          }
          // Equip
          GameState.equippedGear[slot] = item.id;
          
          // Re-calculate active HP to match gear Max HP changes
          const prevMax = GameState.maxHP;
          GameState.maxHP = GameState.getPlayerMaxHP();
          GameState.hp = Math.min(GameState.maxHP, GameState.hp + (GameState.maxHP - prevMax));
          
          GameState.save();
          scene.sound.play('sfx_battle_start', { volume: 0.5 });
          refresh();
        });
      });
    });
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
  cb.on('pointerdown', () => closeGear(scene, onClose));

  scene._gearEscKey = scene.input.keyboard.once('keydown-ESC', () => closeGear(scene, onClose));
}

export function closeGear(scene, onClose = null) {
  if (!scene._gearItems) return;
  scene._gearItems.forEach(o => o.destroy());
  scene._gearItems = null;
  scene._gearEscKey = null;
  if (typeof onClose === 'function') onClose();
}
