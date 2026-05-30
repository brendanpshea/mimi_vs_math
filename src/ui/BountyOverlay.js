import GameState from '../config/GameState.js';
import ENEMIES from '../data/enemies.js';
import REGIONS from '../data/regions/index.js';
import ITEMS from '../data/items.js';

const FONT = "'Nunito', Arial, sans-serif";
const FONT_TITLE = "'Fredoka', 'Nunito', Arial, sans-serif";

export function openBounties(scene, depth = 200, onClose = null) {
  if (scene._bountyItems) return;

  const D = depth;
  const W = scene.cameras.main.width;
  const H = scene.cameras.main.height;
  let items = scene._bountyItems = [];
  const add = o => { items.push(o); return o; };

  // Generate bounties if none exist
  if (!GameState.activeBounties || GameState.activeBounties.length === 0) {
    generateBounties(GameState.currentRegion);
  }

  // Dim background
  const dim = add(scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.82)
    .setDepth(D).setScrollFactor(0).setInteractive());
  dim.on('pointerdown', () => closeBounties(scene, onClose));

  // Panel
  add(scene.add.rectangle(W / 2, H / 2, 500, 420, 0x0A180A)
    .setDepth(D + 1).setScrollFactor(0).setStrokeStyle(2.5, 0x44AA44));

  // Title
  add(scene.add.text(W / 2, H / 2 - 180, '📋  Bounty Board', {
    fontSize: '24px', color: '#88FF88', fontFamily: FONT_TITLE, fontStyle: 'bold',
    stroke: '#000', strokeThickness: 3
  }).setOrigin(0.5).setDepth(D + 2).setScrollFactor(0));

  let startY = H / 2 - 120;

  const refresh = () => {
    // Clear dynamic cards (anything past index 2)
    items.slice(3).forEach(o => o.destroy());
    items = items.slice(0, 3);
    scene._bountyItems = items;

    const bounties = GameState.activeBounties;

    bounties.forEach((q, qIdx) => {
      const cy = startY + qIdx * 90;

      // Card Background
      add(scene.add.rectangle(W / 2, cy, 440, 74, q.completed ? 0x0C2C14 : 0x111F15)
        .setStrokeStyle(1.5, q.completed ? 0x44CC66 : 0x224422).setDepth(D + 2).setScrollFactor(0));

      // Bounty Icon
      const rewardDef = ITEMS[q.reward];
      const emoji = rewardDef?.emoji ?? '🎁';

      // Objective Text
      let label = '';
      if (q.type === 'defeat_enemy') {
        const enemyName = ENEMIES[q.target]?.name ?? q.target;
        label = `Defeat ${q.count} × ${enemyName}`;
      } else if (q.type === 'defeat_any') {
        label = `Defeat any ${q.count} enemies`;
      } else if (q.type === 'streak') {
        label = `Achieve a ${q.count}-answer streak in a battle`;
      }

      add(scene.add.text(W / 2 - 200, cy - 18, label, {
        fontSize: '13px', color: '#FFFFFF', fontFamily: FONT, fontStyle: 'bold'
      }).setOrigin(0, 0.5).setDepth(D + 3).setScrollFactor(0));

      // Progress Tracker
      const progressLabel = q.completed ? 'CLAIMABLE!' : `${q.progress} / ${q.count}`;
      add(scene.add.text(W / 2 - 200, cy + 16, `Progress: ${progressLabel}`, {
        fontSize: '12px', color: q.completed ? '#44FF88' : '#88AABB', fontFamily: FONT, fontStyle: 'bold'
      }).setOrigin(0, 0.5).setDepth(D + 3).setScrollFactor(0));

      // Reward Banner
      add(scene.add.text(W / 2 + 60, cy - 18, `Reward: ${emoji} ${rewardDef?.name ?? q.reward}`, {
        fontSize: '11px', color: '#FFDD44', fontFamily: FONT, fontStyle: 'bold'
      }).setOrigin(0, 0.5).setDepth(D + 3).setScrollFactor(0));

      // Claim or Status Button
      if (q.completed) {
        const claimBtn = add(scene.add.rectangle(W / 2 + 130, cy + 14, 120, 26, 0x155A15)
          .setStrokeStyle(1.5, 0x44FF88).setDepth(D + 3).setScrollFactor(0).setInteractive({ useHandCursor: true }));
        const claimTxt = add(scene.add.text(W / 2 + 130, cy + 14, 'Claim Reward', {
          fontSize: '11px', color: '#FFFFFF', fontFamily: FONT, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(D + 4).setScrollFactor(0));

        claimBtn.on('pointerover', () => claimBtn.setFillStyle(0x227F22));
        claimBtn.on('pointerout',  () => claimBtn.setFillStyle(0x155A15));
        claimBtn.on('pointerdown', () => {
          GameState.addItem(q.reward, 1);
          // Delete/replace this bounty
          GameState.activeBounties.splice(qIdx, 1);
          GameState.save();
          scene.sound.play('sfx_chest_open', { volume: 0.75 });
          
          // Toast pickup
          if (scene._showPickupToast) scene._showPickupToast(q.reward);
          
          refresh();
        });
      } else {
        // Incomplete indicator
        add(scene.add.rectangle(W / 2 + 130, cy + 14, 120, 26, 0x050C1F)
          .setStrokeStyle(1.5, 0x334466).setDepth(D + 3).setScrollFactor(0));
        add(scene.add.text(W / 2 + 130, cy + 14, 'In Progress', {
          fontSize: '11px', color: '#556688', fontFamily: FONT
        }).setOrigin(0.5).setDepth(D + 4).setScrollFactor(0));
      }
    });

    // Refresh option (generate 3 new bounties for 1 Sardine)
    const canRefresh = bounties.length > 0;
    const refBtn = add(scene.add.rectangle(W / 2, H / 2 + 146, 260, 28, canRefresh ? 0x111130 : 0x0A0A15)
      .setStrokeStyle(1.5, canRefresh ? 0x4466AA : 0x223355).setDepth(D + 2).setScrollFactor(0));
    const refTxt = add(scene.add.text(W / 2, H / 2 + 146, `♻️ Get 3 New Bounties (Free!)`, {
      fontSize: '11px', color: canRefresh ? '#99BBDD' : '#556688', fontFamily: FONT, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(D + 3).setScrollFactor(0));

    if (canRefresh) {
      refBtn.setInteractive({ useHandCursor: true });
      refBtn.on('pointerover', () => refBtn.setFillStyle(0x1D2D50));
      refBtn.on('pointerout',  () => refBtn.setFillStyle(0x111130));
      refBtn.on('pointerdown', () => {
        generateBounties(GameState.currentRegion);
        refresh();
      });
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
  cb.on('pointerdown', () => closeBounties(scene, onClose));

  scene._bountiesEscKey = scene.input.keyboard.once('keydown-ESC', () => closeBounties(scene, onClose));
}

export function closeBounties(scene, onClose = null) {
  if (!scene._bountyItems) return;
  scene._bountyItems.forEach(o => o.destroy());
  scene._bountyItems = null;
  scene._bountiesEscKey = null;
  if (typeof onClose === 'function') onClose();
}

function generateBounties(regionId) {
  const rData = REGIONS[regionId];
  if (!rData) return;

  let enemies = rData.enemies;
  if (!enemies && rData.levels) {
    enemies = Array.from(new Set(rData.levels.flatMap(l => (l.enemySpawns || []).map(e => e.id))));
  }
  if (!enemies || enemies.length === 0) enemies = ['slime_pup']; // fallback

  const templates = [
    { type: 'defeat_enemy', count: 3, targets: enemies },
    { type: 'defeat_any', count: 5 },
    { type: 'streak', count: 4 }
  ];

  const rewards = ['sardine', 'catnip', 'yarn_ball', 'lucky_collar', 'math_net', 'math_net']; // nets are highly likely

  const generated = [];
  
  for (let i = 0; i < 3; i++) {
    const t = templates[i % templates.length];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    
    let target = null;
    if (t.type === 'defeat_enemy') {
      target = t.targets[Math.floor(Math.random() * t.targets.length)];
    }

    generated.push({
      id: `bounty_${regionId}_${i}_${Date.now()}`,
      type: t.type,
      count: t.count,
      target: target,
      progress: 0,
      completed: false,
      reward: reward
    });
  }

  GameState.activeBounties = generated;
  GameState.save();
}
