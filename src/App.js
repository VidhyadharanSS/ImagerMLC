import "./App.css";
import React, { useState, useRef, useCallback, useEffect } from "react";

import "./boot.css";

import img1 from "./assets/img1.svg";
import img2 from "./assets/img2.svg";
import img3 from "./assets/img3.svg";

import imageCompression from 'browser-image-compression';
import { Stage, Layer, Rect, Line, Ellipse } from 'react-konva';
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { ImageList, ImageListItem, Slider } from '@mui/material';

function App() {
  const [tab, setTab] = useState(1);
  const [images, setImages] = useState([]);
  const [image, setImage] = useState('');
  const [cropData, setCropData] = useState('');
  const [cropper, setCropper] = useState();
  const [compressImage, setCompressImage] = useState('');
  const [imageData, setImageData] = useState({ size: '', extension: '' });
  const [outputFileName, setOutputFileName] = useState('');
  const [processedImage, setProcessedImage] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [filterIntensity, setFilterIntensity] = useState(100);
  const [currentTag, setCurrentTag] = useState('');
  const [tags, setTags] = useState({});
  const [resizeImage, setResizeImage] = useState(null);
  const [currentTool, setCurrentTool] = useState('brush');
  const [brushColor, setBrushColor] = useState('#000000');
  const [vectorShapes, setVectorShapes] = useState([]);
  const [redoShapes, setRedoShapes] = useState([]);
  const [colorPalette, setColorPalette] = useState([]);
  const [streamedImage, setStreamedImage] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkFont, setWatermarkFont] = useState('Arial');
  const [watermarkSize, setWatermarkSize] = useState(20);
  const [filterProgress, setFilterProgress] = useState(0);
  const [compressionMethod, setCompressionMethod] = useState('standard');
  const [compressionRatio, setCompressionRatio] = useState(0.8);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [resizeWidth, setResizeWidth] = useState('');
const [resizeHeight, setResizeHeight] = useState('');
const [streamProgress, setStreamProgress] = useState(0);


  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const streamCanvasRef = useRef(null);

  // ---------------------------- COMPRESS IMAGE ----------------------------
  const onChangeCompress = (e) => {
    const imageFiles = Array.from(e.target.files);
    setImages(imageFiles.map(file => URL.createObjectURL(file)));
    compressImageUpload(e);
    setOutputFileName(imageFiles[0].name);
  }

  const compressImageUpload = async (event) => {
    const imageFiles = Array.from(event.target.files);
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 500,
      useWebWorker: true,
    }

    try {
      const compressedFiles = await Promise.all(imageFiles.map(file => imageCompression(file, options)));
      setImageData({
        size: (compressedFiles[0].size / 1024).toFixed(2) + " KB",
        extension: compressedFiles[0].type.replace('image/', ''),
      });
      setCompressImage(URL.createObjectURL(compressedFiles[0]));
    } catch (error) {
      console.log(error);
    }
  }

  // ---------------------------- CROP IMAGE ----------------------------
  const onChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const downloadImage = async () => {
    var canvas = document.getElementById("croppedImage");
    var dataUrl = canvas.src;
    let fileNames = document.getElementById("inputIf").value;
    const extension = fileNames.substring(
      fileNames.lastIndexOf(".") + 1,
      fileNames.length
    );
    var fileName = "imagerml-" + Math.floor(Date.now() / 1000) + "." + extension;
    var byteString = atob(dataUrl.split(",")[1]);
    var mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    var blob = new Blob([ab], { type: mimeString });
    var link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(link.href);

    setImage("");
  };

  const getCropData = () => {
    if (typeof cropper !== "undefined") {
      setCropData(cropper.getCroppedCanvas().toDataURL());
    }
  };

  const flipHorizontal = () => {
    if (cropper) {
      cropper.scaleX(cropper.getData().scaleX * -1);
    }
  };

  const flipVertical = () => {
    if (cropper) {
      cropper.scaleY(cropper.getData().scaleY * -1);
    }
  };

  const rotateImage = (angle) => {
    if (cropper) {
      cropper.rotate(angle);
    }
  };
  const handleResizeImageUpload = (e) => {
    const file = e.target.files[0];
    setResizeImage(URL.createObjectURL(file));
  };
  
  const handleResize = () => {
    if (!resizeImage) return;
  
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = parseInt(resizeWidth) || img.width;
      canvas.height = parseInt(resizeHeight) || img.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setProcessedImage(canvas.toDataURL());
    };
    img.src = resizeImage;
  };
  const streamProgressiveJPEG = (imageUrl) => {
    const img = new Image();
    img.src = imageUrl;
  
    let loaded = 0;
    const total = 10; // We'll simulate 10 progressive loads
  
    const drawProgressiveImage = () => {
      if (loaded <= total) {
        const canvas = streamCanvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Simulate progressive loading by increasing blur
        ctx.filter = `blur(${(total - loaded) * 2}px)`;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        loaded++;
        setStreamProgress((loaded / total) * 100);
  
        if (loaded <= total) {
          setTimeout(drawProgressiveImage, 500); // Update every 500ms
        } else {
          ctx.filter = 'none';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
      }
    };
  
    img.onload = () => {
      const canvas = streamCanvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      drawProgressiveImage();
    };
  };
  const downloadResizedImage = () => {
    if (!processedImage) return;
  
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'resized_image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const startStreaming = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      })
      .catch(err => console.error("Error accessing the camera", err));
  };

  const stopStreaming = () => {
    const stream = videoRef.current.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
  };

  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setCapturedImage(canvas.toDataURL('image/png'));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target.result);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        extractColorPalette(imageData);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const extractColorPalette = (imageData) => {
    const colorCounts = {};
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const rgb = `rgb(${r},${g},${b})`;
      colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
    }
    const sortedColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([color]) => color);
    setColorPalette(sortedColors);
  };

  
  

  const applyFilter = useCallback(() => {
    if (!processedImage) return;
  
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      switch (selectedFilter) {
        case 'grayscale':
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = data[i + 1] = data[i + 2] = avg;
          }
          break;
        case 'monochrome':
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const threshold = 128;
            const value = avg >= threshold ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = value;
          }
          break;
        case 'dichrome':
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg > 128 ? 255 : 0;
            data[i + 1] = avg > 128 ? 0 : 255;
            data[i + 2] = 0;
          }
          break;
        case 'sepia':
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
            data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
            data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
          }
          break;
        case 'sobel':
          const grayscale = new Uint8ClampedArray(data.length / 4);
          for (let i = 0; i < data.length; i += 4) {
            grayscale[i / 4] = (data[i] + data[i + 1] + data[i + 2]) / 3;
          }
          const width = canvas.width;
          const height = canvas.height;
          const sobel = new Uint8ClampedArray(data.length);
          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const idx = (y * width + x) * 4;
              const gx = 
                -1 * grayscale[(y-1) * width + (x-1)] +
                -2 * grayscale[(y) * width + (x-1)] +
                -1 * grayscale[(y+1) * width + (x-1)] +
                1 * grayscale[(y-1) * width + (x+1)] +
                2 * grayscale[(y) * width + (x+1)] +
                1 * grayscale[(y+1) * width + (x+1)];
              const gy = 
                -1 * grayscale[(y-1) * width + (x-1)] +
                -2 * grayscale[(y-1) * width + (x)] +
                -1 * grayscale[(y-1) * width + (x+1)] +
                1 * grayscale[(y+1) * width + (x-1)] +
                2 * grayscale[(y+1) * width + (x)] +
                1 * grayscale[(y+1) * width + (x+1)];
              const mag = Math.sqrt(gx * gx + gy * gy);
              sobel[idx] = sobel[idx + 1] = sobel[idx + 2] = mag;
              sobel[idx + 3] = 255;
            }
          }
          imageData.data.set(sobel);
          break;
        case 'invert':
          for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
          }
          break;
        case 'emboss':
          const tempData = new Uint8ClampedArray(data);
          for (let i = 0; i < data.length; i += 4) {
            if (i % (canvas.width * 4) === 0 || i < canvas.width * 4 || i > data.length - canvas.width * 4) {
              data[i] = data[i + 1] = data[i + 2] = 128;
            } else {
              const diff = (tempData[i - 4] - tempData[i + 4]) + 
                           (tempData[i - 3] - tempData[i + 5]) + 
                           (tempData[i - 2] - tempData[i + 6]);
              data[i] = data[i + 1] = data[i + 2] = 128 + diff;
            }
          }
          break;
        case 'brightness':
          for (let i = 0; i < data.length; i += 4) {
            data[i] = data[i] * (brightness / 100);
            data[i + 1] = data[i + 1] * (brightness / 100);
            data[i + 2] = data[i + 2] * (brightness / 100);
          }
          break;
        case 'contrast':
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          for (let i = 0; i < data.length; i += 4) {
            data[i] = factor * (data[i] - 128) + 128;
            data[i + 1] = factor * (data[i + 1] - 128) + 128;
            data[i + 2] = factor * (data[i + 2] - 128) + 128;
          }
          break;
        default:
          break;
      }

      ctx.putImageData(imageData, 0, 0);
    setProcessedImage(canvas.toDataURL());
    };
    img.src = processedImage;
  }, [selectedFilter, processedImage, filterIntensity]);

  const handleTagChange = (e) => {
    setCurrentTag(e.target.value);
  };
  
  const createTagFolder = () => {
    if (currentTag && !tags[currentTag]) {
      setTags(prevTags => ({...prevTags, [currentTag]: []}));
      setCurrentTag('');
    }
  };
  
  const addImageToTag = (tag, imageUrl) => {
    setTags(prevTags => ({
      ...prevTags,
      [tag]: [...(prevTags[tag] || []), imageUrl]
    }));
  };

  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    if (currentTool === "brush") {
      setVectorShapes([...vectorShapes, { tool: currentTool, points: [pos.x, pos.y], color: brushColor }]);
    } else {
      setVectorShapes([...vectorShapes, { tool: currentTool, start: [pos.x, pos.y], end: [pos.x, pos.y], color: brushColor }]);
    }
    setRedoShapes([]);
  };

  const handleMouseMove = (e) => {
    if (!vectorShapes.length) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastShape = vectorShapes[vectorShapes.length - 1];
    if (lastShape.tool === "brush") {
      lastShape.points = lastShape.points.concat([point.x, point.y]);
    } else {
      lastShape.end = [point.x, point.y];
    }
    setVectorShapes(vectorShapes.slice(0, -1).concat(lastShape));
  };

  const handleUndo = () => {
    if (vectorShapes.length > 0) {
      const lastShape = vectorShapes[vectorShapes.length - 1];
      setRedoShapes([lastShape, ...redoShapes]);
      setVectorShapes(vectorShapes.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (redoShapes.length > 0) {
      const lastRedoShape = redoShapes[0];
      setVectorShapes([...vectorShapes, lastRedoShape]);
      setRedoShapes(redoShapes.slice(1));
    }
  };

  const handleDownloadVector = () => {
    const dataURL = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = 'vector-drawing.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStreamedImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        setStreamedImage(canvas);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };
  const onChangeProcess = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        setProcessedImage(canvas.toDataURL());
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };
  useEffect(() => {
    if (streamedImage) {
      const ctx = streamedImage.getContext('2d');
      const imageData = ctx.getImageData(0, 0, streamedImage.width, streamedImage.height);
      const quality = 0.1;
      const worker = new Worker(URL.createObjectURL(new Blob([`
        self.onmessage = function(e) {
          const { imageData, quality } = e.data;
          const canvas = new OffscreenCanvas(imageData.width, imageData.height);
          const ctx = canvas.getContext('2d');
          ctx.putImageData(imageData, 0, 0);
          canvas.convertToBlob({ type: 'image/jpeg', quality }).then(blob => {
            self.postMessage({ blob });
          });
        }
      `], { type: 'application/javascript' })));

      worker.onmessage = (e) => {
        const url = URL.createObjectURL(e.data.blob);
        setStreamedImage(url);
      };

      worker.postMessage({ imageData, quality });

      return () => {
        worker.terminate();
      };
    }
  }, [streamedImage]);

  const applyWatermark = (ctx, text, font, size) => {
    ctx.font = `${size}px ${font}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'center';
    ctx.fillText(text, ctx.canvas.width / 2, ctx.canvas.height / 2);
  };

  const downloadColorPalette = () => {
    const paletteText = colorPalette.join('\n');
    const blob = new Blob([paletteText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'color-palette.txt';
    link.click();
  };

  return (
    <div className="App col-lg-12 pt-5">
      <h2 className="fade-in mb-3">ImagerML</h2>
      <p className="mb-1 slide-in">
        ImagerML allows you to resize, crop, compress, and apply filters to your images. 
        Serve high-quality images in the right size to reduce page weight and load time.
      </p>
      <p>
        Choose the files to resize, crop, compress, process, extract colours and tag your images.
        
      </p>
      <p>
      ImagerML Also has Vector Editing feature to create and edit vector graphics.
      </p>

      <div className="row justify-content-center mt-4">
        <div className="col-lg-8">
          <div className="row mb-5 justify-content-center">
            {['Compress Image', 'Crop Image', 'Resize Image', 'Process Image', 'Tagging', 'Vector Editing', 'Streaming', 'Color Palette'].map((title, index) => (
              <div className="col-lg-3 col-3" key={index}>
                <button
                  type="button"
                  className={`btn btn-block btn-lg py-3 btn-brand ${tab === index + 1 ? "btn-active" : ""}`}
                  onClick={() => setTab(index + 1)}
                >
                  {title}
                </button>
              </div>
            ))}
          </div>

          {tab === 1 && (
            <div className="row" id="leftdiv">
              <div className="col-6" id="leftdivcard">
                <h2 className="mb-3">Choose Image to Compress: </h2>
                <div className="row mb-3">
                  <div className="col-8">
                    <input
                      className="form-control"
                      type="file"
                      id="inputIf1"
                      accept="image/png,image/jpeg,image/jpg"
                      multiple
                      onChange={onChangeCompress}
                    />
                    {images.length > 0 && (
                      <ImageList cols={3}>
                        {images.map((image, index) => (
                          <ImageListItem key={index}>
                            <img src={image} alt={`compressed-${index}`} />
                          </ImageListItem>
                        ))}
                      </ImageList>
                    )}
                  </div>
                  <div className="col-4">
                    <select 
                      className="form-control"
                      value={compressionMethod}
                      onChange={(e) => setCompressionMethod(e.target.value)}
                    >
                      <option value="standard">Standard Compression</option>
                      <option value="lossy">Lossy Compression</option>
                      <option value="huffman">Huffman Coding</option>
                    </select>
                    <input 
                      type="number" 
                      className="form-control mt-2" 
                      value={compressionRatio} 
                      onChange={(e) => setCompressionRatio(e.target.value)} 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      placeholder="Compression Ratio" 
                    />
                  </div>
                </div>
                <div className="text-center"></div>
              </div>
              <div className="col-6" id="rightdiv">
                <div id="itemdivcard">
                  <h2 className="mb-3">Your compressed image: </h2>
                  <table>
                    <tbody>
                      <tr>
                        <td><h5>SIZE : </h5></td>
                        <td><h5>{imageData.size}</h5></td>
                      </tr>
                      <tr>
                        <td><h5>EXTENSION : </h5></td>
                        <td><h5>{imageData.extension}</h5></td>
                      </tr>
                    </tbody>
                  </table>
                  {compressImage ? (
                    <>
                      <img
                        style={{ width: "100%" }}
                        src={compressImage}
                        alt="compress"
                        id="compressimage"
                      />
                      <a
                        href={compressImage}
                        download={outputFileName}
                        className="mt-2 btn btn-primary w-75"
                      >
                        Download Compressed Image
                      </a>
                    </>
                  ) : (
                    <button
                      style={{ cursor: "not-allowed" }}
                      type="button"
                      className="btn btn-primary btn-lg"
                      disabled
                    >
                      Download Image
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 2 && (
            <div className="row" id="leftdiv">
              <div className="col-6" id="leftdivcard">
                <h2 className="mb-3">Select Image to Crop</h2>
                <div className="row mb-3">
                  <div className="col-8">
                    <input
                      className="form-control"
                      type="file"
                      id="inputIf"
                      accept="image/png,image/jpeg,image/jpg"
                      multiple
                      onChange={onChange}
                    />
                  </div>
                  <div className="col-4">
                    <button
                      type="button"
                      className="btn btn-primary btn-lg btn-block"
                      onClick={getCropData}
                      id="leftbutton"
                    >
                      Crop Image
                    </button>
                  </div>
                </div>
                <div className="text-center">
                  <Cropper
                    className="cropper"
                    initialAspectRatio={1}
                    src={image}
                    viewMode={1}
                    minCropBoxHeight={10}
                    minCropBoxWidth={10}
                    background={false}
                    responsive={true}
                    autoCropArea={1}
                    checkOrientation={false}
                    onInitialized={(instance) => {
                      setCropper(instance);
                    }}
                    guides={true}
                  />
                </div>
                <div className="text-center mt-3">
                  <button onClick={flipHorizontal} className="btn btn-secondary mr-2">Flip Horizontal</button>
                  <button onClick={flipVertical} className="btn btn-secondary mr-2">Flip Vertical</button>
                  <input type="number" placeholder="Rotate Angle" onChange={(e) => rotateImage(e.target.value)} className="form-control d-inline-block w-auto" />
                </div>
              </div>
              <div className="col-6" id="rightdiv">
                <div id="itemdivcard">
                  <h2 className="mb-3">Your cropped image: </h2>
                  {cropData ? (
                    <>
                      <img
                        style={{ width: "100%" }}
                        src={cropData}
                        alt="cropping"
                        id="croppedImage"
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-lg mt-3"
                        onClick={downloadImage}
                      >
                        Download Image
                      </button>
                    </>
                  ) : (
                    <button
                      style={{ cursor: "not-allowed" }}
                      type="button"
                      className="btn btn-primary btn-lg"
                      disabled
                    >
                      Download Image
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

{tab === 3 && (
  <div className="row" id="leftdiv">
    <div className="col-12" id="leftdivcard">
      <h2 className="mb-3">Resize Image</h2>
      <input
        type="file"
        accept="image/*"
        onChange={handleResizeImageUpload}
        className="form-control mb-3"
      />
      <div className="row mb-3">
        <div className="col-4">
          <input
            type="number"
            className="form-control"
            placeholder="Width"
            value={resizeWidth}
            onChange={(e) => setResizeWidth(e.target.value)}
          />
        </div>
        <div className="col-4">
          <input
            type="number"
            className="form-control"
            placeholder="Height"
            value={resizeHeight}
            onChange={(e) => setResizeHeight(e.target.value)}
          />
        </div>
        <div className="col-4">
          <button className="btn btn-primary" onClick={handleResize}>Resize</button>
        </div>
      </div>
      {processedImage && (
        <div>
          <img src={processedImage} alt="Resized" style={{ maxWidth: '100%' }} />
          <button className="btn btn-success mt-3" onClick={downloadResizedImage}>
            Download Resized Image
          </button>
        </div>
      )}
    </div>
  </div>
)}
          {tab === 4 && (
            <div className="row" id="leftdiv">
              <div className="col-6" id="leftdivcard">
                <h2 className="mb-3">Select Image to Process</h2>
                <div className="row mb-3">
                  <div className="col-8">
                    <input
                      className="form-control"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      multiple
                      onChange={onChangeProcess}
                    />
                  </div>
                  <div className="col-4">
                    <select 
                      className="form-control"
                      value={selectedFilter}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                    >
                      <option value="">Select Filter</option>
                      <option value="grayscale">Grayscale</option>
                      <option value="monochrome">Monochrome</option>
                      <option value="dichrome">Dichrome</option>
                      <option value="sepia">Sepia</option>
                      <option value="sobel">Edge Detection (Sobel)</option>
                      <option value="invert">Invert</option>
                      <option value="emboss">Emboss</option>
                      <option value="brightness">Brightness</option>
                      <option value="contrast">Contrast</option>
                    </select>
                    <Slider
  value={filterIntensity}
  onChange={(e, newValue) => setFilterIntensity(newValue)}
  aria-labelledby="filter-intensity-slider"
  min={0}
  max={100}
  step={1}
  className="mt-2"
/>
<div className="progress mt-2">
  <div 
    className="progress-bar" 
    role="progressbar" 
    style={{width: `${filterIntensity}%`}} 
    aria-valuenow={filterIntensity} 
    aria-valuemin="0" 
    aria-valuemax="100"
  >
    {filterIntensity}%
  </div>
</div>
                  </div>
                </div>
                <div className="text-center">
                <button
  type="button"
  className="btn btn-primary btn-lg"
  onClick={applyFilter}
  disabled={!processedImage || !selectedFilter}
>
  Apply Filter
</button>
                  <div className="progress mt-3">
                    <div className="progress-bar" role="progressbar" style={{ width: `${filterProgress}%` }} aria-valuenow={filterProgress} aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                </div>
              </div>
              <div className="col-6" id="rightdiv">
                <div id="itemdivcard">
                  <h2 className="mb-3">Processed image will appear here!</h2>
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  {processedImage && (
                    <>
                      <img
                        style={{ width: "100%" }}
                        src={processedImage}
                        alt="processed"
                        id="processedImage"
                      />
                      <a
                        href={processedImage}
                        download={`processed_${selectedFilter}.png`}
                        className="mt-2 btn btn-primary w-75"
                      >
                        Download Processed Image
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}




{tab === 5 && (
  <div className="row" id="taggingDiv">
    <div className="col-12">
      <h2>Image Tagging</h2>
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          value={currentTag}
          onChange={handleTagChange}
          placeholder="Enter tag name"
        />
        <button className="btn btn-primary" onClick={createTagFolder}>
          Create Tag Folder
        </button>
      </div>
      {Object.keys(tags).map(tag => (
        <div key={tag} className="mb-4">
          <h3>{tag}</h3>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              Array.from(e.target.files).forEach(file => 
                addImageToTag(tag, URL.createObjectURL(file))
              );
            }}
            className="form-control mb-2"
          />
          <ImageList cols={3} rowHeight={164}>
            {tags[tag].map((image, index) => (
              <ImageListItem key={index}>
                <img src={image} alt={`Tagged ${tag}`} loading="lazy" />
              </ImageListItem>
            ))}
          </ImageList>
        </div>
      ))}
    </div>
  </div>
)}

          {tab === 6 && (
            <div className="row" id="vectorEditingDiv">
              <div className="col-12">
                <h2>Vector Editing</h2>
                <div>
                  <button onClick={() => setCurrentTool("brush")}>Brush</button>
                  <button onClick={() => setCurrentTool("line")}>Line</button>
                  <button onClick={() => setCurrentTool("rectangle")}>Rectangle</button>
                  <button onClick={() => setCurrentTool("ellipse")}>Ellipse</button>
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                  />
                  <button onClick={handleUndo}>Undo</button>
                  <button onClick={handleRedo}>Redo</button>
                  <button onClick={handleDownloadVector}>Download</button>
                </div>
                <Stage
                  width={500}
                  height={500}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  ref={stageRef}
                  style={{border: '1px solid white'}}
                >
                  <Layer>
                    {vectorShapes.map((shape, i) => {
                      if (shape.tool === "brush") {
                        return <Line key={i} points={shape.points} stroke={shape.color} />;
                      } else if (shape.tool === "line") {
                        return <Line key={i} points={[...shape.start, ...shape.end]} stroke={shape.color} />;
                      } else if (shape.tool === "rectangle") {
                        return (
                          <Rect
                            key={i}
                            x={Math.min(shape.start[0], shape.end[0])}
                            y={Math.min(shape.start[1], shape.end[1])}
                            width={Math.abs(shape.start[0] - shape.end[0])}
                            height={Math.abs(shape.start[1] - shape.end[1])}
                            stroke={shape.color}
                          />
                        );
                      } else if (shape.tool === "ellipse") {
                        return (
                          <Ellipse
                            key={i}
                            x={(shape.start[0] + shape.end[0]) / 2}
                            y={(shape.start[1] + shape.end[1]) / 2}
                            radiusX={Math.abs(shape.start[0] - shape.end[0]) / 2}
                            radiusY={Math.abs(shape.start[1] - shape.end[1]) / 2}
                            stroke={shape.color}
                          />
                        );
                      }
                      return null;
                    })}
                  </Layer>
                </Stage>
              </div>
            </div>
          )}

{tab === 7 && (
  <div className="row" id="streamingDiv">
    <div className="col-12">
      <h2>Progressive JPEG Streaming</h2>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => streamProgressiveJPEG(URL.createObjectURL(e.target.files[0]))}
        className="form-control mb-3"
      />
      <div className="progress mb-3">
        <div 
          className="progress-bar" 
          role="progressbar" 
          style={{width: `${streamProgress}%`}}
          aria-valuenow={streamProgress} 
          aria-valuemin="0" 
          aria-valuemax="100"
        >
          {streamProgress.toFixed(0)}%
        </div>
      </div>
      <canvas ref={streamCanvasRef} style={{ maxWidth: '100%' }}></canvas>
    </div>
  </div>
)}
          {tab === 8 && (
            <div className="row" id="colorPaletteDiv">
              <div className="col-12">
                <h2>Color Palette Generator</h2>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                {uploadedImage && (
                  <div>
                    <img src={uploadedImage} alt="Uploaded" style={{ maxWidth: '100%', marginTop: '20px' }} />
                    <div style={{ display: 'flex', marginTop: '20px' }}>
                      {colorPalette.map((color, index) => (
                        <div
                          key={index}
                          style={{
                            backgroundColor: color,
                            width: '50px',
                            height: '50px',
                            margin: '0 5px',
                          }}
                        ></div>
                      ))}
                    </div>
                    <button onClick={downloadColorPalette} className="btn btn-primary mt-3">Download Color Palette</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;