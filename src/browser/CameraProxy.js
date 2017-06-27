/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

var HIGHEST_POSSIBLE_Z_INDEX = 2147483647;

function takePicture(success, error, opts) {
    if (opts && opts[2] === 1) {
        capture(success, error, opts);
    } else {
        var input = document.createElement('input');
        input.style.position = 'relative';
        input.style.zIndex = HIGHEST_POSSIBLE_Z_INDEX;
        input.className = 'cordova-camera-select';
        input.type = 'file';
        input.name = 'files[]';

        input.onchange = function(inputEvent) {
            var reader = new FileReader();
            reader.onload = function(readerEvent) {
                input.parentNode.removeChild(input);

                var imageData = readerEvent.target.result;

                return success(imageData.substr(imageData.indexOf(',') + 1));
            };

            reader.readAsDataURL(inputEvent.target.files[0]);
        };

        document.body.appendChild(input);
    }
}

function capture(success, errorCallback, opts) {
    var localMediaStream;
    var targetWidth = opts[3];
    var targetHeight = opts[4];

    targetWidth = targetWidth === -1 ? 320 : targetWidth;
    targetHeight = targetHeight === -1 ? 240 : targetHeight;

    var video = document.createElement('video');
    var parent = document.createElement('div');
    parent.style.position = 'relative';
    parent.style.zIndex = HIGHEST_POSSIBLE_Z_INDEX;
    parent.className = 'cordova-camera-capture';

    var guiOpts = opts[10] || {};

    if (Object.prototype.hasOwnProperty.call(guiOpts, 'className')) {
        if (parent.className && parent.className.length) {
            parent.className += ' ' + guiOpts.className;
        } else {
            parent.className = guiOpts.className;
        }
    }
    video.width = targetWidth;
    video.height = targetHeight;

    var controls = document.createElement('div');
    var button1 = document.createElement('button');
    var button2 = document.createElement('button');

    var stopStream = function(stream) {
        // Note that MediaStream.stop() is deprecated as of Chrome 47.
        if (stream.stop) {
            stream.stop();
        } else {
            stream.getTracks().forEach(function(track) {
                track.stop();
            });
        }
    };

    var getButtonText = function(index, defaultValue) {
        return guiOpts && guiOpts.buttons && guiOpts.buttons[index] && guiOpts.buttons[index].text ? guiOpts.buttons[index].text : defaultValue;
    };

    controls.appendChild(button1);
    controls.appendChild(button2);

    button1.innerHTML = getButtonText(0, 'Capture!');
    button2.innerHTML = getButtonText(1, 'Cancel');

    parent.appendChild(video);
    parent.appendChild(controls);

    button2.onclick = function() {
        stopStream(localMediaStream);
        parent.parentNode.removeChild(parent);
        return errorCallback('');
    };

    button1.onclick = function() {
        // create a canvas and capture a frame from video stream
        var canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        var newWidth, newHeight,
            aspect = video.videoHeight / video.videoWidth;
        if (aspect < 1) {
            newWidth = targetWidth;
            newHeight = targetWidth * aspect;
        } else {
            newHeight = targetHeight;
            newWidth = targetHeight * aspect;

        }
        canvas.width = newWidth;
        canvas.height = newHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, newWidth, newHeight);

        // convert image stored in canvas to base64 encoded image
        var imageData = canvas.toDataURL('image/png');
        imageData = imageData.replace('data:image/png;base64,', '');

        // stop video stream, remove video and button.
        stopStream(localMediaStream);
        parent.parentNode.removeChild(parent);

        return success(imageData);
    };

    navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

    var successCallback = function(stream) {
        localMediaStream = stream;
        video.src = window.URL.createObjectURL(localMediaStream);
        video.play();

        document.body.appendChild(parent);
    };

    if (navigator.getUserMedia) {
        navigator.getUserMedia({video: true, audio: false}, successCallback, errorCallback);
    } else {
        alert('Browser does not support camera :(');
    }
}

module.exports = {
    takePicture: takePicture,
    cleanup: function() {
    }
};

require("cordova/exec/proxy").add("Camera", module.exports);
