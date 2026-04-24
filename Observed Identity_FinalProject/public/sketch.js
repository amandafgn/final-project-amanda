let faceMesh;
let video;
let faces = [];

// snapshot profile
let capturedProfile = null;

let scanStartTime = 0;
let scanning = false;
let locked = false;

let lockedHair = "UNKNOWN";
let lockedGlasses = "UNKNOWN";
let lockedMood = "UNKNOWN";

let options = {
  maxFaces: 1,
  refineLandmarks: false,
  flipHorizontal: false
};

function preload() {
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(900, 500);

  video = createCapture(VIDEO, () => {
    console.log("camera started");
  });

  video.size(640, 480);
  video.hide();

  faceMesh.detectStart(video, gotFaces);

  textFont("monospace");
  rectMode(CORNER);
}

function draw() {
  background(0);

  // mirror only the camera
  push();
  translate(640, 0);
  scale(-1, 1);
  image(video, 0, 0, 640, 480);
  pop();

  drawScanLines();
  drawTimestamp();
  drawCameraLabel();

  // scanning / lock logic
  if (faces.length > 0) {
    if (!scanning && !locked) {
      scanning = true;
      scanStartTime = millis();
    }

    if (scanning && millis() - scanStartTime > 1500) {
      locked = true;
      scanning = false;

      if (faces.length > 0) {
        let face = faces[0];
        lockedHair = detectHairColor(face);
        lockedGlasses = detectGlasses(face);
        lockedMood = detectMood(face);
        captureProfileImage();
      }
    }
  } else {
    scanning = false;
    locked = false;
    lockedHair = "UNKNOWN";
    lockedGlasses = "UNKNOWN";
    lockedMood = "UNKNOWN";
    capturedProfile = null;
  }

  for (let i = 0; i < faces.length; i++) {
    let face = faces[i];

    let x = 640 - face.box.xMin - face.box.width;
    let y = face.box.yMin;
    let w = face.box.width;
    let h = face.box.height;

    let centerX = 640 - (face.box.xMin + face.box.xMax) / 2;
    let centerY = (face.box.yMin + face.box.yMax) / 2;

    drawBracketBox(x, y, w, h);
    drawSubjectLabel(x, y);
    drawGlitchCrosshair(centerX, centerY);

    if (scanning) {
      drawScanningText(centerX, centerY);
    } else if (locked) {
      drawConfidence(x, y, w);
      drawProfileCard(lockedHair, lockedGlasses, lockedMood);
    }
  }

  if (faces.length === 0) {
    drawIdlePanel();
  }
}

function gotFaces(results) {
  faces = results;
}

// WORKING SNAPSHOT METHOD
function captureProfileImage() {
  // this is the simple full-frame snapshot method that worked
  capturedProfile = video.get();
  console.log("SNAPSHOT TAKEN");
}

function drawScanLines() {
  stroke(255, 255, 255, 18);
  strokeWeight(1);
  for (let y = 0; y < 480; y += 4) {
    line(0, y, 640, y);
  }
}

function drawTimestamp() {
  let now = new Date();
  let timeText = now.toLocaleTimeString();
  let dateText = now.toLocaleDateString();

  noStroke();
  fill(0, 180);
  rect(10, 10, 170, 42);

  fill(255, 0, 0);
  textSize(12);
  text(dateText, 20, 27);
  text(timeText, 20, 44);
}

function drawCameraLabel() {
  noStroke();
  fill(0, 180);
  rect(500, 10, 130, 42);

  fill(255, 0, 0);
  textSize(12);
  text("CAM 03", 515, 27);
  text("REC ● LIVE", 515, 44);
}

function drawBracketBox(x, y, w, h) {
  let c = 18;

  stroke(255, 0, 0);
  strokeWeight(3);
  noFill();

  line(x, y, x + c, y);
  line(x, y, x, y + c);

  line(x + w, y, x + w - c, y);
  line(x + w, y, x + w, y + c);

  line(x, y + h, x + c, y + h);
  line(x, y + h, x, y + h - c);

  line(x + w, y + h, x + w - c, y + h);
  line(x + w, y + h, x + w, y + h - c);
}

function drawSubjectLabel(x, y) {
  noStroke();
  fill(255, 0, 0);
  rect(x, y - 24, 150, 18);

  fill(255);
  textSize(11);
  text("SUBJECT DETECTED", x + 6, y - 11);
}

function drawConfidence(x, y, w) {
  let confidence = floor(random(84, 99));

  noStroke();
  fill(0, 180);
  rect(x, y + w * 0.02 + 8, 140, 20);

  fill(255, 0, 0);
  textSize(11);
  text("MATCH: " + confidence + "%", x + 8, y + w * 0.02 + 22);
}

function drawGlitchCrosshair(centerX, centerY) {
  let jitterX = random(-3, 3);
  let jitterY = random(-3, 3);
  let cx = centerX + jitterX;
  let cy = centerY + jitterY;
  let size = random(7, 12);

  stroke(255, 0, 0);
  strokeWeight(2);

  line(cx - size, cy, cx + size, cy);
  line(cx, cy - size, cx, cy + size);

  if (random() < 0.25) {
    line(cx - size * 2, cy, cx - size, cy);
  }

  if (random() < 0.25) {
    line(cx, cy + size, cx, cy + size * 2);
  }

  if (random() > 0.45) {
    noStroke();
    fill(255, 0, 0);
    circle(cx, cy, 2.5);
  }
}

function drawScanningText(cx, cy) {
  let dots = floor((millis() / 300) % 4);
  let dotText = ".".repeat(dots);

  fill(255, 0, 0);
  textSize(12);
  text("SCANNING" + dotText, cx - 40, cy - 20);
}

function drawProfileCard(hair, glasses, mood) {
  let panelX = 660;
  let panelY = 20;
  let panelW = 220;
  let panelH = 440;

  noStroke();
  fill(10, 10, 10, 235);
  rect(panelX, panelY, panelW, panelH);

  stroke(255, 0, 0);
  strokeWeight(1.5);
  noFill();
  rect(panelX, panelY, panelW, panelH);

  fill(255, 0, 0);
  noStroke();
  textSize(14);
  text("PROFILE DOSSIER", panelX + 14, panelY + 24);

  stroke(255, 0, 0, 120);
  line(panelX + 12, panelY + 34, panelX + panelW - 12, panelY + 34);

  // SAME BOX AS BEFORE
  noFill();
  stroke(255, 0, 0);
  rect(panelX + 14, panelY + 50, 90, 110);

  // put snapshot in same area
  if (capturedProfile) {
    image(capturedProfile, panelX + 14, panelY + 50, 90, 110);
  }

  fill(255, 0, 0);
  noStroke();
  textSize(11);
  text("ID: S-01", panelX + 120, panelY + 68);
  text("STATUS: LOCKED", panelX + 120, panelY + 88);
  text("MATCH: VERIFIED", panelX + 120, panelY + 108);

  fill(255);
  textSize(11);
  text("NAME: SUBJECT", panelX + 14, panelY + 190);
  text("ROLE: PARTICIPANT", panelX + 14, panelY + 212);
  text("HAIR: " + hair, panelX + 14, panelY + 234);
  text("GLASSES: " + glasses, panelX + 14, panelY + 256);
  text("MOOD: " + mood, panelX + 14, panelY + 278);

  fill(255, 0, 0);
  text("PRIVATE NOTE:", panelX + 14, panelY + 312);

  fill(255);
  text("Keeps things offline", panelX + 14, panelY + 332);
  text("but leaves digital traces.", panelX + 14, panelY + 348);

  fill(255, 0, 0);
  text("SYSTEM INFERENCE:", panelX + 14, panelY + 382);

  fill(255);
  text("HIGH SELF-CURATION", panelX + 14, panelY + 402);
  text("LOW PRIVACY VISIBILITY", panelX + 14, panelY + 418);
  text("CONFIDENCE: 96%", panelX + 14, panelY + 434);
}

function drawIdlePanel() {
  let panelX = 660;
  let panelY = 20;
  let panelW = 220;
  let panelH = 440;

  noStroke();
  fill(10, 10, 10, 235);
  rect(panelX, panelY, panelW, panelH);

  stroke(255, 0, 0);
  strokeWeight(1.5);
  noFill();
  rect(panelX, panelY, panelW, panelH);

  fill(255, 0, 0);
  noStroke();
  textSize(14);
  text("PROFILE DOSSIER", panelX + 14, panelY + 24);

  fill(255);
  textSize(11);
  text("NO SUBJECT LOCKED", panelX + 14, panelY + 60);
  text("WAITING FOR INPUT...", panelX + 14, panelY + 80);
}

// -----------------------
// ORIGINAL DETECTION FUNCTIONS
// -----------------------

function detectHairColor(face) {
  let sampleX = width - (face.box.xMin + face.box.width / 2);
  let sampleY = max(5, face.box.yMin - 15);

  let c = get(sampleX, sampleY);
  let r = red(c);
  let g = green(c);
  let b = blue(c);

  let brightness = (r + g + b) / 3;

  if (brightness < 55) return "BLACK";
  if (brightness < 110) return "BROWN";
  if (brightness < 170) return "DARK BLONDE";
  return "LIGHT / UNCLEAR";
}

function detectGlasses(face) {
  let sampleY = face.box.yMin + face.box.height * 0.38;

  let leftX = width - (face.box.xMin + face.box.width * 0.32);
  let rightX = width - (face.box.xMin + face.box.width * 0.68);

  let leftColor = get(leftX, sampleY);
  let rightColor = get(rightX, sampleY);

  let leftBrightness = (red(leftColor) + green(leftColor) + blue(leftColor)) / 3;
  let rightBrightness = (red(rightColor) + green(rightColor) + blue(rightColor)) / 3;

  let avgBrightness = (leftBrightness + rightBrightness) / 2;

  if (avgBrightness < 70) return "YES";
  if (avgBrightness < 95) return "POSSIBLE";
  return "NO";
}

function detectMood(face) {
  let ratio = face.box.width / face.box.height;

  if (ratio > 0.82) return "HAPPY";
  if (ratio < 0.72) return "SURPRISED";
  if (random() < 0.15) return "ANGRY";
  return "NEUTRAL";
}
