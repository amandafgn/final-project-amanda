// document ready is triggered when the page loads, part of JQuery a javascript library
$(document).ready(function () {
  // once page loaded, trigger facial recognition
  startRecognition();
});

loadModels = async () => {
  return new Promise(async (resolve, reject) => {
    console.log("Loading models...");

    // load models from folder called models
    const MODEL_URL = "/models";
    await faceapi.loadSsdMobilenetv1Model(MODEL_URL);
    await faceapi.loadFaceLandmarkModel(MODEL_URL);
    await faceapi.loadFaceRecognitionModel(MODEL_URL);
    console.log("Finished loading models.");
    resolve();
  });
};

startRecognition = async () => {
  // load models
  await loadModels();

  // get the image from the html
  const img = document.getElementById("original_image");

  // detect faces within the image
  let fullFaceDescriptions = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();

  // get the html canvas element to draw bounding boxes and shapes on it
  const canvas = $("#gui_overlay").get(0);
  faceapi.matchDimensions(canvas, img);

  // size the results relevant to the DOM image size
  fullFaceDescriptions = faceapi.resizeResults(fullFaceDescriptions, img);

  // draw the facial landmarks onto it
  faceapi.draw.drawDetections(canvas, fullFaceDescriptions);

  // draw the facial landmarks
  faceapi.draw.drawFaceLandmarks(canvas, fullFaceDescriptions);

  // *** FACIAL RECOGNITION PART ***
  // create an array of all the people to look for - match to imgs of them in the img folder
  // use reference images to determine if the people in the picture match
  const labels = ["don", "zining"];

  // loop thru labels array, detect and save the descriptor containing facial landmarks in an array, which is transformed into labeled face descriptors
  const labeledFaceDescriptors = await Promise.all(
    labels.map(async (label) => {
      // fetch image data from urls and convert blob to HTMLImage element
      const imgUrl = `img/${label}.jpg`;
      const img = await faceapi.fetchImage(imgUrl);

      // detect face with highest score, compute it's landmarks + face descriptor
      const fullFaceDescription = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

      if (!fullFaceDescription) {
        throw new Error(`no faces detected for ${label}`);
      }

      const faceDescriptors = [fullFaceDescription.descriptor];
      return new faceapi.LabeledFaceDescriptors(label, faceDescriptors);
    })
  );

  // determine max euclidian distance, use faceMatcher() to compare all faces to group image
  const maxDescriptorDistance = 0.6;
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, maxDescriptorDistance);

  // fill results array with best matches based on descriptors generated above
  const results = fullFaceDescriptions.map((fd) => faceMatcher.findBestMatch(fd.descriptor));

  // loop thru each best match, draw detection box + name + confidence
  results.forEach((bestMatch, i) => {
  const box = fullFaceDescriptions[i].detection.box;

  let label = bestMatch.label;
  let confidence = bestMatch.distance.toFixed(2);

  let displayName;
  let imgSrc;

  if (label === "unknown") {
    displayName = "UNKNOWN";
    imgSrc = "img/unknown.jpg";
  } else {
    displayName = label.toUpperCase();
    imgSrc = `img/${label}.jpg`;
  }

  const text = `${displayName} (${confidence})`;

  const drawBox = new faceapi.draw.DrawBox(box, { label: text });
  drawBox.draw(canvas);

  // draw image next to face
function drawProfileImage(src, box) {
  const ctx = document.getElementById("gui_overlay").getContext("2d");

  const img = new Image();
  img.src = src;

  img.onload = () => {
    ctx.drawImage(
      img,
      box.x + box.width + 10, // position to the right
      box.y,
      80,
      80
    );
  };
}
});

  console.log("Done.");
};
