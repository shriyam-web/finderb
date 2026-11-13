export function reviewCardFileName(businessName: string) {
  const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'business';
  return `${slug}-finderb-review-qr.png`;
}

export function reviewQrCardHtml(input: {
  businessName: string;
  place: string;
  reviewUrl: string;
  qrBase64: string;
  logoBase64?: string | null;
}) {
  const name = JSON.stringify(input.businessName);
  const place = JSON.stringify(input.place || 'On FinderB');
  const qrSrc = JSON.stringify(`data:image/png;base64,${input.qrBase64}`);
  const logoSrc = JSON.stringify(input.logoBase64 ? `data:image/png;base64,${input.logoBase64}` : '');

  return `<!DOCTYPE html>
<html>
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;background:#FFFFFF">
<canvas id="c"></canvas>
<script>
(function () {
  var CARD_W = 1080;
  var CARD_H = 1920;
  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  var name = ${name};
  var place = ${place};
  var logoSrc = ${logoSrc};
  var BLUE = '#153551';
  var BLUE_MID = '#215481';
  var ORANGE = '#E8873A';
  var MUTED = '#5E6E80';
  var LINE = '#E7EEF5';
  var font = 'Inter';

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapCentered(text, x, y, maxWidth, lineHeight) {
    var words = String(text).split(/\\s+/);
    var line = '';
    var lines = [];
    for (var i = 0; i < words.length; i++) {
      var next = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = words[i];
        if (lines.length >= 2) {
          lines.push(words[i] + '…');
          line = '';
          break;
        }
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    for (var l = 0; l < lines.length && l < 2; l++) ctx.fillText(lines[l], x, y + l * lineHeight);
  }

  function spacedCenter(text, x, y, gap) {
    ctx.textAlign = 'left';
    var parts = String(text).split('');
    var widths = [];
    var total = 0;
    for (var i = 0; i < parts.length; i++) {
      var w = ctx.measureText(parts[i]).width;
      widths.push(w);
      total += w + (i ? gap : 0);
    }
    var left = x - total / 2;
    for (var p = 0; p < parts.length; p++) {
      ctx.fillText(parts[p], left, y);
      left += widths[p] + gap;
    }
    ctx.textAlign = 'center';
  }

  function tick(x, y, dx, dy, arm) {
    ctx.beginPath();
    ctx.moveTo(x + dx * arm, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * arm);
    ctx.stroke();
  }

  function fail(message) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: message }));
  }

  function finish() {
    var data = canvas.toDataURL('image/png');
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'png',
      data: data.split(',')[1] || ''
    }));
  }

  function drawLockup(logo, y, mark, wordSize) {
    var label = 'FinderB Business';
    var pipe = '|';
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = '500 ' + Math.round(wordSize * 0.92) + 'px ' + font;
    var pipeW = ctx.measureText(pipe).width;
    ctx.font = '700 ' + wordSize + 'px ' + font;
    var wordW = ctx.measureText(label).width;
    var gap = Math.round(mark * 0.14);
    var logoW = logo ? mark : 0;
    var x = (CARD_W - (logoW + gap + pipeW + gap + wordW)) / 2;
    if (logo) ctx.drawImage(logo, x, y, mark, mark);
    var mid = y + mark / 2;
    ctx.fillStyle = '#8AA0B5';
    ctx.font = '500 ' + Math.round(wordSize * 0.92) + 'px ' + font;
    ctx.fillText(pipe, x + logoW + gap, mid);
    ctx.fillStyle = BLUE;
    ctx.font = '700 ' + wordSize + 'px ' + font;
    ctx.fillText(label, x + logoW + gap + pipeW + gap, mid);
    ctx.restore();
  }

  function paint(qr, logo) {
    var wash = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
    wash.addColorStop(0, '#D7E7F6');
    wash.addColorStop(0.45, '#FFFFFF');
    wash.addColorStop(1, '#FFE4C4');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    ctx.fillStyle = BLUE;
    ctx.fillRect(0, 0, CARD_W, 22);
    ctx.fillStyle = ORANGE;
    ctx.fillRect(0, 22, CARD_W, 12);
    ctx.fillStyle = ORANGE;
    ctx.fillRect(0, CARD_H - 34, CARD_W, 12);
    ctx.fillStyle = BLUE;
    ctx.fillRect(0, CARD_H - 22, CARD_W, 22);

    var logoHeight = 110;
    ctx.textAlign = 'center';
    if (logo) {
      drawLockup(logo, 96, 122, 54);
      logoHeight = 122;
    } else {
      ctx.fillStyle = BLUE;
      ctx.font = '700 40px ' + font;
      ctx.fillText('FinderB Business', CARD_W / 2, 150);
    }

    var ruleY = 78 + logoHeight + 38;
    ctx.fillStyle = BLUE;
    ctx.fillRect(CARD_W / 2 - 72, ruleY, 72, 4);
    ctx.fillStyle = ORANGE;
    ctx.fillRect(CARD_W / 2, ruleY, 72, 4);

    ctx.fillStyle = BLUE;
    ctx.font = '700 64px ' + font;
    wrapCentered(name, CARD_W / 2, ruleY + 132, 860, 74);

    ctx.fillStyle = MUTED;
    ctx.font = '500 30px ' + font;
    ctx.fillText(place, CARD_W / 2, ruleY + 278);

    var plate = 680;
    var plateX = (CARD_W - plate) / 2;
    var plateY = 690;
    ctx.fillStyle = '#F6F9FC';
    roundRect(plateX, plateY, plate, plate, 36);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    roundRect(plateX + 18, plateY + 18, plate - 36, plate - 36, 28);
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    roundRect(plateX + 18, plateY + 18, plate - 36, plate - 36, 28);
    ctx.stroke();

    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = ORANGE;
    tick(plateX + 38, plateY + 38, 1, 1, 42);
    tick(plateX + plate - 38, plateY + 38, -1, 1, 42);
    ctx.strokeStyle = BLUE_MID;
    tick(plateX + 38, plateY + plate - 38, 1, -1, 42);
    tick(plateX + plate - 38, plateY + plate - 38, -1, -1, 42);

    ctx.drawImage(qr, plateX + 70, plateY + 70, plate - 140, plate - 140);

    ctx.fillStyle = BLUE;
    ctx.font = '600 36px ' + font;
    ctx.fillText('Scan to leave a review', CARD_W / 2, plateY + plate + 82);
    ctx.fillStyle = MUTED;
    ctx.font = '500 26px ' + font;
    ctx.fillText('Takes less than a minute', CARD_W / 2, plateY + plate + 122);

    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(180, CARD_H - 210);
    ctx.lineTo(CARD_W - 180, CARD_H - 210);
    ctx.stroke();

    if (logo) {
      drawLockup(logo, CARD_H - 160, 57, 32);
    }
    ctx.fillStyle = MUTED;
    ctx.font = '500 24px ' + font;
    ctx.fillText('Verified reviews  ·  finderb.com', CARD_W / 2, CARD_H - 48);
    finish();
  }

  function start() {
    try {
      var qr = new Image();
      qr.onload = function () {
        if (!logoSrc) {
          paint(qr, null);
          return;
        }
        var logo = new Image();
        logo.onload = function () { paint(qr, logo); };
        logo.onerror = function () { paint(qr, null); };
        logo.src = logoSrc;
      };
      qr.onerror = function () { fail('Could not draw the QR code.'); };
      qr.src = ${qrSrc};
    } catch (error) {
      fail(String(error && error.message ? error.message : error));
    }
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start).catch(start);
  } else {
    start();
  }
})();
</script>
</body>
</html>`;
}
