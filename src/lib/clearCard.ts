import type { Chore } from './chores.ts';
import { formatCardDate, formatClock } from './format.ts';

export type CardData = {
  chore: Chore;
  minutes: number;
  survivedMs: number;
  streak: number;
  xp: number;
  at: number;
  rehearsal: boolean;
  combo: number;
};

function rounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.rect(x, y, w, h);
}

function paintGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(246, 241, 231, 0.05)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function statBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  value: string,
  label: string,
) {
  ctx.fillStyle = '#120814';
  rounded(ctx, x, y, w, h, 28);
  ctx.fill();
  ctx.fillStyle = '#f6f1e7';
  ctx.font = '700 64px "Oxanium Variable", ui-monospace, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(value, x + w / 2, y + 86);
  ctx.fillStyle = 'rgba(246, 241, 231, 0.72)';
  ctx.font = '600 24px "Outfit Variable", system-ui, sans-serif';
  ctx.fillText(label, x + w / 2, y + 132);
}

export async function renderClearCard(data: CardData): Promise<Blob> {
  await document.fonts.load('800 120px "Syne Variable"');
  await document.fonts.load('700 64px "Oxanium Variable"');
  await document.fonts.load('600 32px "Outfit Variable"');
  await document.fonts.ready;

  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  ctx.fillStyle = '#120814';
  ctx.fillRect(0, 0, width, height);
  paintGrid(ctx, width, height);

  const glow = ctx.createRadialGradient(820, 280, 40, 820, 280, 420);
  glow.addColorStop(0, `${data.chore.color}88`);
  glow.addColorStop(1, 'rgba(18, 8, 20, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#1c1026';
  rounded(ctx, 48, 48, width - 96, height - 96, 48);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#d6ff3f';
  ctx.stroke();

  ctx.fillStyle = data.chore.color;
  ctx.beginPath();
  ctx.arc(920, 180, 78, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#120814';
  ctx.beginPath();
  ctx.arc(892, 168, 16, 0, Math.PI * 2);
  ctx.arc(948, 168, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f6f1e7';
  ctx.beginPath();
  ctx.arc(896, 172, 7, 0, Math.PI * 2);
  ctx.arc(944, 172, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f6f1e7';
  ctx.font = '800 42px "Syne Variable", sans-serif';
  ctx.fillText('STILL GOING', 96, 160);

  ctx.fillStyle = '#d6ff3f';
  ctx.fillRect(96, 184, 220, 10);

  ctx.font = '800 108px "Syne Variable", sans-serif';
  ctx.fillText(data.rehearsal ? 'PRACTICE' : 'CLEARED', 96, 320);

  const bossName = data.chore.boss.toUpperCase();
  ctx.fillStyle = '#f6f1e7';
  let bossSize = 84;
  ctx.font = `800 ${bossSize}px "Syne Variable", sans-serif`;
  while (bossSize > 48 && ctx.measureText(bossName).width > 860) {
    bossSize -= 4;
    ctx.font = `800 ${bossSize}px "Syne Variable", sans-serif`;
  }
  ctx.fillText(bossName, 96, 450);

  ctx.fillStyle = 'rgba(246, 241, 231, 0.8)';
  ctx.font = '600 36px "Outfit Variable", system-ui, sans-serif';
  const subtitle = data.rehearsal
    ? `${data.chore.label} · rehearsal of a ${data.minutes} min raid`
    : `${data.chore.label} · ${data.minutes} minutes`;
  ctx.fillText(subtitle, 96, 520);

  ctx.fillStyle = '#f6f1e7';
  ctx.font = '700 168px "Oxanium Variable", ui-monospace, sans-serif';
  ctx.fillText(formatClock(data.survivedMs), 96, 740);
  ctx.fillStyle = 'rgba(246, 241, 231, 0.7)';
  ctx.font = '600 28px "Outfit Variable", system-ui, sans-serif';
  ctx.fillText(data.rehearsal ? 'practice clock · not saved' : 'on the chore', 100, 790);

  const date = formatCardDate(data.at);
  const boxY = 860;
  const boxW = 276;
  const gap = 24;
  const startX = 96;
  statBox(ctx, startX, boxY, boxW, 180, String(data.streak), 'streak');
  statBox(ctx, startX + boxW + gap, boxY, boxW, 180, `+${data.xp}`, 'xp');
  statBox(ctx, startX + (boxW + gap) * 2, boxY, boxW, 180, date.day, date.year);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#d6ff3f';
  ctx.font = '700 30px "Outfit Variable", system-ui, sans-serif';
  ctx.fillText('The game you play while you finish the chore.', 96, 1160);
  ctx.fillStyle = 'rgba(246, 241, 231, 0.55)';
  ctx.font = '500 24px "Outfit Variable", system-ui, sans-serif';
  const extra = data.combo > 1 ? `Best combo ${data.combo}` : 'Stay with it.';
  ctx.fillText(extra, 96, 1210);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), 'image/png');
  });
  if (!blob) throw new Error('Could not encode the card');
  return blob;
}
