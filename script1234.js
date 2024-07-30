

// Get the canvas element and set up the renderer
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(640, 640);
renderer.setClearColor(0x000000);

// Create a scene
const scene = new THREE.Scene();

// Create a camera
const aspect = 1;
const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 1000);
// camera.position.set(2, 1.64, 2);
camera.position.set(2, 1.64, 2);
camera.lookAt(scene.position);

// Add lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5).normalize();
scene.add(light);

// Function to create a cube with given dimensions and rotation
function createCube(width, height, depth, rotation) {
    const geometry = new THREE.BoxGeometry(width, height, depth);

    // Separate edges into front and back
    const edges = new THREE.EdgesGeometry(geometry);
    const frontEdges = [];
    const backEdges = [];
    for (let i = 0; i < edges.attributes.position.count; i += 2) {
        const v1 = new THREE.Vector3().fromBufferAttribute(edges.attributes.position, i);
        const v2 = new THREE.Vector3().fromBufferAttribute(edges.attributes.position, i + 1);

        // Determine if the edge is front or back by checking the z-coordinates of its vertices
        if (v1.z >= 0 && v2.z >= 0) {
            frontEdges.push(v1, v2);
        } else {
            backEdges.push(v1, v2);
        }
    }

    // Create buffer geometries for front and back edges
    const frontGeometry = new THREE.BufferGeometry().setFromPoints(frontEdges);
    const backGeometry = new THREE.BufferGeometry().setFromPoints(backEdges);

    // Create materials for front and back edges
    const frontMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const backMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.25 });

    // Create line segments for front and back edges
    const frontLines = new THREE.LineSegments(frontGeometry, frontMaterial);
    const backLines = new THREE.LineSegments(backGeometry, backMaterial);

    frontLines.rotation.y = THREE.Math.degToRad(rotation);
    backLines.rotation.y = THREE.Math.degToRad(rotation);

    scene.add(frontLines);
    scene.add(backLines);
}
// Function to update the cube with a new rotation and dimensions
function updateCube(rotation, width, height, depth) {
    scene.clear(); // Clear previous cubes
    createCube(width * 0.115, height * 0.115, depth * 0.115, rotation);
    renderer.render(scene, camera);
}


// Create a cube with specified dimensions and rotation
// const angles = [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5, 360];
const angles = [0, 18.5, 45, 71.5, 90, 108.5, 135, 161.5, 180, 198.5, 225, 251.5, 270, 288.5, 315, 341.5, 360];
let currentAngleIndex = 3; // Start with 0 degrees

// Initial cube
updateCube(angles[currentAngleIndex], 1, 1, 1);

// Event listener for the generate button
document.getElementById('width').addEventListener('input', () => {
    redrawCube()
});
document.getElementById('height').addEventListener('input', () => {
    redrawCube()
});
document.getElementById('depth').addEventListener('input', () => {
    redrawCube()
});

const redrawCube = () => {
    const width = parseFloat(document.getElementById('width').value);
    const height = parseFloat(document.getElementById('height').value);
    const depth = parseFloat(document.getElementById('depth').value);
    updateCube(angles[currentAngleIndex], width, height, depth);
}



// Save the image after a slight delay to ensure rendering
document.getElementById('save').addEventListener('click', async () => {
    await saveAsImage();
});

// Add event listeners for changing the rotation
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        currentAngleIndex = (currentAngleIndex - 1 + angles.length) % angles.length;
    } else if (event.key === 'ArrowRight') {
        currentAngleIndex = (currentAngleIndex + 1) % angles.length;
    }
    const width = parseFloat(document.getElementById('width').value);
    const height = parseFloat(document.getElementById('height').value);
    const depth = parseFloat(document.getElementById('depth').value);
    updateCube(angles[currentAngleIndex], width, height, depth);
});


document.getElementById('left').onclick = () => {
    currentAngleIndex = (currentAngleIndex - 1 + angles.length) % angles.length;
    const width = parseFloat(document.getElementById('width').value);
    const height = parseFloat(document.getElementById('height').value);
    const depth = parseFloat(document.getElementById('depth').value);
    updateCube(angles[currentAngleIndex], width, height, depth);
}
document.getElementById('right').onclick = () => {
    currentAngleIndex = (currentAngleIndex + 1) % angles.length;
    const width = parseFloat(document.getElementById('width').value);
    const height = parseFloat(document.getElementById('height').value);
    const depth = parseFloat(document.getElementById('depth').value);
    updateCube(angles[currentAngleIndex], width, height, depth);
}

async function processImage(dataURL) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = dataURL;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Replace black pixels with fully transparent pixels
            imageData = replaceBlackWithTransparent(imageData);
            ctx.putImageData(imageData, 0, 0);

            // Trim the image
            const trimmedData = trimImageData(ctx, imageData);

            canvas.width = trimmedData.width;
            canvas.height = trimmedData.height;
            ctx.putImageData(trimmedData.imageData, 0, 0);

            const trimmedDataURL = canvas.toDataURL('image/png');
            resolve(trimmedDataURL);
        };

        img.onerror = reject;
    });
}

function replaceBlackWithTransparent(imageData) {
    const { data } = imageData;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0 && data[i + 3] !== 0) {
            data[i + 3] = 0; // Set alpha to 0 (fully transparent)
        }
    }
    return imageData;
}

function trimImageData(ctx, imageData) {
    const { data, width, height } = imageData;
    let top = 0, bottom = height, left = 0, right = width;

    // Find top boundary
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (data[(y * width + x) * 4 + 3] !== 0) {
                top = y;
                y = height; // Break outer loop
                break;
            }
        }
    }

    // Find bottom boundary
    for (let y = height - 1; y >= 0; y--) {
        for (let x = 0; x < width; x++) {
            if (data[(y * width + x) * 4 + 3] !== 0) {
                bottom = y + 1;
                y = -1; // Break outer loop
                break;
            }
        }
    }

    // Find left boundary
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (data[(y * width + x) * 4 + 3] !== 0) {
                left = x;
                x = width; // Break outer loop
                break;
            }
        }
    }

    // Find right boundary
    for (let x = width - 1; x >= 0; x--) {
        for (let y = 0; y < height; y++) {
            if (data[(y * width + x) * 4 + 3] !== 0) {
                right = x + 1;
                x = -1; // Break outer loop
                break;
            }
        }
    }

    const trimmedWidth = right - left;
    const trimmedHeight = bottom - top;
    const trimmedData = ctx.getImageData(left, top, trimmedWidth, trimmedHeight);

    return { width: trimmedWidth, height: trimmedHeight, imageData: trimmedData };
}


// Function to save canvas as PNG
async function saveAsImage() {
    renderer.render(scene, camera);
    let dataURL = canvas.toDataURL('image/png');
    console.log(dataURL);
    dataURL = await processImage(dataURL)
    console.log(dataURL);

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'cube.png';
    link.click();
}

