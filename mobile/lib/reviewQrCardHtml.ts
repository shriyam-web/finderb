export function reviewCardFileName(businessName: string) {
  const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'business';
  return `${slug}-finderb-review-qr.png`;
}

export function reviewQrCardHtml(input: {
  businessName: string;
  place: string;
  reviewUrl: string;
  qrBase64: string;
}) {
  const name = JSON.stringify(input.businessName);
  const place = JSON.stringify(input.place || 'On FinderB');
  const qrSrc = JSON.stringify(`data:image/png;base64,${input.qrBase64}`);

  return `<!DOCTYPE html>
<html>
<body style="margin:0;background:#12324c">
<canvas id="c"></canvas>
<script>
(function () {
  var CARD_W = 1080;
  var CARD_H = 1350;
  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  var name = ${name};
  var place = ${place};

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(text, x, y, maxWidth, lineHeight) {
    var words = String(text).split(/\\s+/);
    var line = '';
    var top = y;
    var lines = 0;
    for (var i = 0; i < words.length; i++) {
      var next = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(next).width > maxWidth && line) {
        ctx.fillText(line, x, top);
        line = words[i];
        top += lineHeight;
        lines += 1;
        if (lines >= 2) {
          ctx.fillText(words[i] + '…', x, top);
          return;
        }
      } else {
        line = next;
      }
    }
    if (line) ctx.fillText(line, x, top);
  }

  function fail(message) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: message }));
  }

  try {
    var bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
    bg.addColorStop(0, '#0b1f33');
    bg.addColorStop(0.45, '#153551');
    bg.addColorStop(1, '#215481');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    ctx.fillStyle = 'rgba(249, 212, 138, 0.14)';
    ctx.beginPath();
    ctx.arc(980, 120, 220, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(80, 1280, 260, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f9d48a';
    ctx.font = '700 28px sans-serif';
    ctx.fillText('FINDERB', 80, 110);
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = '500 22px sans-serif';
    ctx.fillText('Trusted local businesses of India', 80, 148);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 64px sans-serif';
    wrapText(name, 80, 280, 920, 72);

    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = '600 28px sans-serif';
    ctx.fillText(place, 80, 430);

    ctx.fillStyle = '#ffffff';
    roundRect(90, 500, 900, 620, 36);
    ctx.fill();

    var qr = new Image();
    qr.onload = function () {
      try {
        ctx.drawImage(qr, 290, 540, 500, 500);
        ctx.fillStyle = '#153551';
        ctx.font = '700 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Scan to review us on FinderB', CARD_W / 2, 1080);
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255,255,255,0.86)';
        ctx.font = '600 26px sans-serif';
        ctx.fillText('This business is live on FinderB', 80, 1220);
        ctx.fillStyle = 'rgba(255,255,255,0.58)';
        ctx.font = '500 22px sans-serif';
        ctx.fillText('finderb.com', 80, 1260);
        var data = canvas.toDataURL('image/png');
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'png',
          data: data.split(',')[1] || ''
        }));
      } catch (error) {
        fail(String(error && error.message ? error.message : error));
      }
    };
    qr.onerror = function () { fail('Could not draw the QR code.'); };
    qr.src = ${qrSrc};
  } catch (error) {
    fail(String(error && error.message ? error.message : error));
  }
})();
</script>
</body>
</html>`;
}
