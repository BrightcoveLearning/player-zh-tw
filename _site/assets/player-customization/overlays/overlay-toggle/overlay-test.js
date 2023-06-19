videojs("popularVideosPlayer").ready(function () {
    'use strict';
    var player = this,
        reportURL = 'https://analytics.api.brightcove.com/v1/data',
        proxyURL = 'https://solutions.brightcove.com/bcls/bcls-proxy/doc-samples-proxy.php',
        apiRequest = document.getElementById('apiRequest'),
        responseData = document.getElementById('responseData'),
        // get the epoch time in milliseconds 24 hours ago
        // 12 hours in milliseconds = 1000 * 24 * 60 * 60 = 86,400,000
        yesterday = new Date().valueOf() - 86400000;

    init();

    /**
     * create an element
     *
     * @param  {string} type - the element type
     * @param  {object} attributes - attributes to add to the element
     * @return {HTMLElement} the HTML element
     */
    function createEl(type, attributes) {
        var el,
            attr;
        el = document.createElement(type);
        if (attributes !== null) {
            for (attr in attributes) {
                el.setAttribute(attr, attributes[attr]);
            }
            return el;
        }
    }

    /**
     * adds text content to an element
     * @param {HTMLElement} el the element
     * @param {string} str the text content
     */
    function addText(el, str) {
        el.appendChild(document.createTextNode(str));
    }

    /**
     * extract video ids from Analytics API response
     * @param {array} aapiData the data from the Analytics API
     * @return {array} videoIds array of video ids
     */
    function extractVideoIds(aapiData) {
        var i,
            iMax = aapiData.items.length,
            videoIds = [];
        for (i = 0; i < iMax; i++) {
            if (aapiData.items[i].video !== null) {
                videoIds.push(aapiData.items[i].video);
            }
        }
        return videoIds;
    }

    /**
     * get video objects
     * @param {array} videoIds array of video ids
     * @return {array} videoData array of video objects
     */
    function getVideoData(videoIds, callback) {
        var i = 0,
            iMax = videoIds.length,
            videoData = [];

        function getVideo() {
            player.catalog.getVideo(videoIds[i], pushData);
        }

        function pushData(error, video) {
            videoData.push(video);
            if (i === iMax) {
                callback(videoData);
            } else {
                i++;
                getVideo();
            }
        }
    }

    /**
     * create the html for the overlay
     * @param {array} videoData array of video objects
     * @return {HTMLElement} videoList the div element containing the overlay
     */
    function createVideoList(videoData) {
        console.log(videoData);
        var i,
            iMax = videoData.length,
            videoList = createEl('div', {id: 'videoList'}),
            videoHeader = createEl('h3'),
            videoWrapper = createEl('div'),
            thumbnailImage;
        addText(videoHeader, 'Popular Videos');
        videoList.appendChild(videoHeader);
        videoList.appendChild(videoWrapper);
        for (i = 0; i < iMax; i++) {
            thumbnailImage = createEl('img', {class: 'video-thumbnail', 'data-video-id': videoData[i].id, src: videoData[i].thumbnail});
            videoWrapper.appendChild(thumbnailImage);
        }
        return videoList;
    }

    /**
     * sets up the data for the API request
     * @param {String} id the id of the button that was clicked
     */
    function setRequestData() {
        var endPoint = '',
            requestData = {};
        // note that we don't have to set the to date to now because that's the default
        endPoint = '?accounts=1752604059001&dimensions=video&sort=-video_view&limit=6&from=' + yesterday;
        requestData.url = reportURL + endPoint;
        requestData.requestType = 'GET';
        apiRequest.textContent = requestData.url;
        return requestData;
    }
    /**
     * send API request to the proxy
     * @param  {object} requestData options for the request
     * @param  {string} requestID the type of request = id of the button
     * @return {object} parsedData the parsed API response
     */
    function getMediaData(options, callback) {
        var httpRequest = new XMLHttpRequest(),
            responseRaw,
            parsedData,
            requestParams;
        // set up request data
        requestParams = 'url=' + encodeURIComponent(options.url) + '&requestType=' + options.requestType;
        // set response handler
        httpRequest.onreadystatechange = getResponse;
        // open the request
        httpRequest.open('POST', proxyURL);
        // set headers
        httpRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        // open and send request
        httpRequest.send(requestParams);
        // response handler
        function getResponse() {
            try {
                if (httpRequest.readyState === 4) {
                    if (httpRequest.status >= 200 && httpRequest.status < 300) {
                        responseRaw = httpRequest.responseText;
                        responseData.textContent = responseRaw;
                        parsedData = JSON.parse(responseRaw);
                        responseData.textContent = JSON.stringify(parsedData, null, '  ');
                        callback(parsedData);
                    } else {
                        alert('There was a problem with the request. Request returned ' + httpRequest.status);
                    }
                }
            } catch (e) {
                alert('Caught Exception: ' + e);
            }
        }
    }

    function init() {
        var requestData = {},
            videoIds = [],
            videoList,
            overlayDiv = createEl('div', {id: 'bclsOverlay'});
        player.catalog.getVideo(player.options()['data-video-id'], function(error, video) {
            //deal with error
            // console.log('error', error);
            player.catalog.load(video);
            // add the overlay
            player.overlay({
                overlays: [
                    {
                        align: 'top',
                        content: overlayDiv,
                        start: 'pause',
                        end: 'play'
                    },
                    {
                        align: 'top',
                        content: overlayDiv,
                        start: 'ended',
                        end: 'play'
                    }
                ]
            });
            // set up data for Analytics API request
            requestData = setRequestData();
            // make the Analytics API request
            getMediaData(requestData, function (analyticsData) {
                // extract the video ids into an array
                videoIds = extractVideoIds(analyticsData);
                // use the catalog to get the video data
                getVideoData(videoIds, function (videoData) {
                    // generate the HTML for the overlay
                    videoList = createVideoList(videoData);
                    // add the overlay
                    overlayDiv.appendChild(videoList);

                });
            });
        });
    }
});