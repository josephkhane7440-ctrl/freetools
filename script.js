// ========================================
// FREE IMAGE COMPRESSOR
// ========================================

const imageInput = document.getElementById("imageInput");
const moreImageInput = document.getElementById("moreImageInput");
const dropArea = document.getElementById("dropArea");

const settings = document.getElementById("settings");
const result = document.getElementById("result");

const imageList = document.getElementById("imageList");

const fileCount = document.getElementById("fileCount");
const totalSize = document.getElementById("totalSize");

const targetSize = document.getElementById("targetSize");
const compressButton = document.getElementById("compressButton");

const resultCount = document.getElementById("resultCount");
const resultOriginal = document.getElementById("resultOriginal");
const resultCompressed = document.getElementById("resultCompressed");

const downloadButton = document.getElementById("downloadButton");
const resetButton = document.getElementById("resetButton");


// ========================================
// FILE STORAGE
// ========================================

let selectedFiles = [];
let compressedFiles = [];


// ========================================
// FORMAT SIZE
// ========================================

function formatSize(bytes) {

    if (bytes < 1024) {
        return bytes + " B";
    }

    if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + " KB";
    }

    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}


// ========================================
// ADD FILES
// ========================================

function addFiles(files) {

    const validFiles = Array.from(files).filter(file => {

        return (
            file.type === "image/jpeg" ||
            file.type === "image/png" ||
            file.type === "image/webp"
        );

    });


    if (validFiles.length === 0) {

        alert("Please select JPG, PNG or WebP images.");

        return;
    }


    validFiles.forEach(file => {

        const exists = selectedFiles.some(existing =>

            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified

        );


        if (!exists) {

            selectedFiles.push(file);

        }

    });


    updateInterface();

}


// ========================================
// UPDATE INTERFACE
// ========================================

function updateInterface() {

    imageList.innerHTML = "";


    if (selectedFiles.length === 0) {

        settings.classList.add("hidden");
        dropArea.classList.remove("hidden");

        return;
    }


    dropArea.classList.add("hidden");
    settings.classList.remove("hidden");


    fileCount.textContent =
        selectedFiles.length +
        (selectedFiles.length === 1 ? " image" : " images");


    const totalBytes = selectedFiles.reduce(
        (total, file) => total + file.size,
        0
    );


    totalSize.textContent = formatSize(totalBytes);


    selectedFiles.forEach((file, index) => {

        const item = document.createElement("div");

        item.className = "image-item";


        const left = document.createElement("div");

        left.className = "image-item-left";


        const number = document.createElement("div");

        number.className = "image-number";

        number.textContent = index + 1;


        const details = document.createElement("div");

        details.className = "image-details";


        const name = document.createElement("strong");

        name.textContent = file.name;


        const size = document.createElement("span");

        size.textContent = formatSize(file.size);


        details.appendChild(name);
        details.appendChild(size);


        left.appendChild(number);
        left.appendChild(details);


        const removeButton = document.createElement("button");

        removeButton.className = "remove-image";

        removeButton.type = "button";

        removeButton.textContent = "×";


        removeButton.addEventListener("click", function () {

            selectedFiles.splice(index, 1);

            updateInterface();

        });


        item.appendChild(left);
        item.appendChild(removeButton);


        imageList.appendChild(item);

    });

}


// ========================================
// IMAGE SELECT
// ========================================

imageInput.addEventListener("change", function (event) {

    addFiles(event.target.files);

    imageInput.value = "";

});


// ========================================
// ADD MORE
// ========================================

moreImageInput.addEventListener("change", function (event) {

    addFiles(event.target.files);

    moreImageInput.value = "";

});


// ========================================
// DRAG AND DROP
// ========================================

dropArea.addEventListener("dragover", function (event) {

    event.preventDefault();

    dropArea.classList.add("dragover");

});


dropArea.addEventListener("dragleave", function () {

    dropArea.classList.remove("dragover");

});


dropArea.addEventListener("drop", function (event) {

    event.preventDefault();

    dropArea.classList.remove("dragover");

    addFiles(event.dataTransfer.files);

});


// ========================================
// IMAGE COMPRESSION
// ========================================

function compressImage(file, targetKB) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();


        reader.onload = function (event) {

            const img = new Image();


            img.onload = function () {

                let width = img.width;
                let height = img.height;


                const maxDimension = 2400;


                if (
                    width > maxDimension ||
                    height > maxDimension
                ) {

                    const scale = Math.min(
                        maxDimension / width,
                        maxDimension / height
                    );


                    width = Math.round(width * scale);
                    height = Math.round(height * scale);

                }


                const canvas = document.createElement("canvas");

                const ctx = canvas.getContext("2d");


                canvas.width = width;
                canvas.height = height;


                ctx.drawImage(
                    img,
                    0,
                    0,
                    width,
                    height
                );


                let quality = 0.9;


                function tryCompression() {

                    canvas.toBlob(

                        function (blob) {

                            if (!blob) {

                                reject(
                                    new Error(
                                        "Compression failed."
                                    )
                                );

                                return;
                            }


                            const targetBytes =
                                targetKB * 1024;


                            if (
                                blob.size <= targetBytes ||
                                quality <= 0.1
                            ) {

                                resolve(blob);

                                return;
                            }


                            quality -= 0.05;


                            if (quality < 0.3) {

                                width =
                                    Math.round(width * 0.85);

                                height =
                                    Math.round(height * 0.85);


                                canvas.width = width;
                                canvas.height = height;


                                ctx.drawImage(
                                    img,
                                    0,
                                    0,
                                    width,
                                    height
                                );


                                quality = 0.75;

                            }


                            tryCompression();

                        },

                        "image/jpeg",

                        quality

                    );

                }


                tryCompression();

            };


            img.onerror = function () {

                reject(
                    new Error("Could not read image.")
                );

            };


            img.src = event.target.result;

        };


        reader.onerror = function () {

            reject(
                new Error("Could not load image.")
            );

        };


        reader.readAsDataURL(file);

    });

}


// ========================================
// COMPRESS BUTTON
// ========================================

compressButton.addEventListener(
    "click",
    async function () {

        if (selectedFiles.length === 0) {

            alert("Please select at least one image.");

            return;
        }


        const targetKB =
            parseInt(targetSize.value);


        compressButton.disabled = true;

        compressButton.textContent =
            "Compressing Images...";


        compressedFiles = [];


        let originalTotal = 0;
        let compressedTotal = 0;


        try {

            for (
                let i = 0;
                i < selectedFiles.length;
                i++
            ) {

                const file =
                    selectedFiles[i];


                compressButton.textContent =
                    "Compressing " +
                    (i + 1) +
                    " of " +
                    selectedFiles.length +
                    "...";


                const blob =
                    await compressImage(
                        file,
                        targetKB
                    );


                originalTotal += file.size;

                compressedTotal += blob.size;


                compressedFiles.push({

                    original: file,

                    blob: blob

                });

            }


            // ========================================
            // SHOW RESULT
            // ========================================

            resultCount.textContent =
                compressedFiles.length;


            resultOriginal.textContent =
                formatSize(originalTotal);


            resultCompressed.textContent =
                formatSize(compressedTotal);


            settings.classList.add("hidden");

            result.classList.remove("hidden");


            downloadButton.textContent =
                "↓  Download All as ZIP";


        } catch (error) {

            console.error(error);

            alert(
                "Something went wrong while compressing."
            );

        }


        compressButton.disabled = false;

        compressButton.textContent =
            "Compress Images";

    }
);


// ========================================
// DOWNLOAD ALL AS ZIP
// ========================================

downloadButton.addEventListener(
    "click",
    async function () {

        if (compressedFiles.length === 0) {

            alert("No compressed images available.");

            return;
        }


        if (typeof JSZip === "undefined") {

            alert(
                "ZIP system could not load. Please refresh the page and try again."
            );

            return;
        }


        downloadButton.disabled = true;

        downloadButton.textContent =
            "Creating ZIP...";


        try {

            const zip = new JSZip();


            compressedFiles.forEach((item, index) => {

                const originalName =
                    item.original.name;


                const cleanName =
                    originalName.replace(
                        /\.[^/.]+$/,
                        ""
                    );


                const fileName =
                    cleanName +
                    "-compressed.jpg";


                zip.file(
                    fileName,
                    item.blob
                );

            });


            const zipBlob =
                await zip.generateAsync({

                    type: "blob",

                    compression: "DEFLATE",

                    compressionOptions: {
                        level: 6
                    }

                });


            const url =
                URL.createObjectURL(zipBlob);


            const link =
                document.createElement("a");


            link.href = url;

            link.download =
                "FreeTools-Compressed-Images.zip";


            document.body.appendChild(link);

            link.click();

            link.remove();


            setTimeout(function () {

                URL.revokeObjectURL(url);

            }, 3000);


            downloadButton.textContent =
                "✓  ZIP Downloaded";


            setTimeout(function () {

                downloadButton.textContent =
                    "↓  Download All as ZIP";

                downloadButton.disabled = false;

            }, 2000);


        } catch (error) {

            console.error(error);


            alert(
                "Could not create ZIP file."
            );


            downloadButton.disabled = false;

            downloadButton.textContent =
                "↓  Download All as ZIP";

        }

    }
);


// ========================================
// RESET
// ========================================

resetButton.addEventListener(
    "click",
    function () {

        selectedFiles = [];

        compressedFiles = [];


        imageInput.value = "";

        moreImageInput.value = "";


        result.classList.add("hidden");

        settings.classList.add("hidden");

        dropArea.classList.remove("hidden");


        imageList.innerHTML = "";


        fileCount.textContent =
            "0 images";


        totalSize.textContent =
            "0 KB";


        resultCount.textContent =
            "0";


        resultOriginal.textContent =
            "0 KB";


        resultCompressed.textContent =
            "0 KB";


        downloadButton.textContent =
            "↓  Download All as ZIP";


        downloadButton.disabled = false;

    }
);


// ========================================
// CLICK DROP AREA
// ========================================

dropArea.addEventListener(
    "click",
    function (event) {

        if (
            event.target.closest(".upload-button")
        ) {

            return;
        }


        imageInput.click();

    }
);


// ========================================
// INITIALIZE
// ========================================

updateInterface();